require('dotenv').config();

const {remote} = require('webdriverio');
const {Kafka} = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.CONSUMER_CLIENT_ID,
  brokers: process.env.IS_APP_STANDALONE
    ? ['0.0.0.0:9092'] // to support standalone
    : ['kafka:29092'], // to support docker compose
});

const TOPIC = process.env.KAFKA_TOPIC;
const consumer = kafka.consumer({groupId: process.env.CONSUMER_GROUP_ID});

const autopay = async refNo => {
  const IS_DEBUG = true;
  let browser = null;

  if (refNo) {
    const kpayLogin = {
      url: process.env.TARGET_WEB_URL,
      username: process.env.TARGET_WEB_USR,
      password: process.env.TARGET_WEB_PWD,
    };

    try {
      browser = await remote({
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: IS_DEBUG ? [] : ['headless', 'disable-gpu'],
          },
        },
      });

      await browser.url(kpayLogin.url);

      const usernameElem = await browser.$('input[name=email]');
      await usernameElem.setValue(kpayLogin.username);

      const passwordElem = await browser.$('input[name=password]');
      await passwordElem.setValue(kpayLogin.password);

      const submitBtn = await browser.$('button[type=submit]');
      await submitBtn.click();

      // Fetch by content
      const thaiQrTab = await browser.$('aria/THAI QR INQUIRY');
      await thaiQrTab.click();

      let searchBtn = await browser.$('aria/SEARCH');
      await searchBtn.click();

      const refNoElem = await browser.$(`aria/${refNo}`);
      const refNoStatus = await browser.$('aria/REQUESTED');
      const isDisplayedRefNo = await refNoElem.isDisplayed();
      const isDisplayedTransStatus = await refNoStatus.isDisplayed();
      if (isDisplayedRefNo && isDisplayedTransStatus) {
        await refNoElem.click();

        const qrIdElem = await browser.$('#qr-id');
        const qrId = await qrIdElem.getText();

        const qrSimTab = await browser.$('aria/QR SIMULATOR');
        await qrSimTab.click();

        const inputQrIdElem = await browser.$('input[formcontrolname=qrId]');
        await inputQrIdElem.setValue(qrId);

        searchBtn = await browser.$('aria/SEARCH');
        await searchBtn.click();

        const payBtn = await browser.$('aria/Pay');
        await payBtn.click();
      } else {
        console.log(
          `Stop process, Ref number "${refNo}" is not set to REQUESTED.`,
        );
      }
    } catch (err) {
      console.log('Web scraping error :', err);
    } finally {
      await browser.saveScreenshot(`./ss/${new Date().toISOString()}.png`);
      await browser.deleteSession();
    }
  } else {
    console.log('Unknown Ref Number.');
  }
};

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({topic: TOPIC, fromBeginning: true});

  await consumer.run({
    eachMessage: async ({topic, partition, message}) => {
      let data = null;

      try {
        data = JSON.parse(message.value.toString());
        console.log('Consume to do something :', {
          partition,
          offset: message.offset,
          value: data,
        });

        await autopay(data.ref);
      } catch (err) {
        console.log('Parse JSON data error :', err);
      }
    },
  });
};

run().catch(console.error);
