import '../ignoreWarnings';

import React, {useState, createRef} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import DialogInput from 'react-native-dialog-input';

function App(): JSX.Element {
  const DEFAULT_TEXT = '';
  const [host, setHost] = useState<string>('localhost');
  const [price, setPrice] = useState<string>(DEFAULT_TEXT);
  const [unit, setUnit] = useState<string>(DEFAULT_TEXT);
  const [result, setResult] = useState<string>(DEFAULT_TEXT);
  const [isDialogVisible, setDialogVisible] = useState<Boolean>(false);

  let scanner = createRef<QRCodeScanner>();

  const onSuccess = e => {
    let data = e.data;
    console.log('scanned data : ', data);

    try {
      const info = data.split('-');
      setPrice(info[1]);
      setUnit(info[2]);
      setResult(info.slice(3, info.length).join('-'));
    } catch (err) {
      setResult(err.message);
    }
  };

  const clearToText = () => {
    setPrice(DEFAULT_TEXT);
    setUnit(DEFAULT_TEXT);
    setResult(DEFAULT_TEXT);
  };

  const onClickPay = () => {
    const socket = new WebSocket(`ws://${host}:9001/qr`);

    if (scanner) {
      scanner.current?.reactivate();
    }

    socket.onopen = () => {
      console.log('connected');
      // now we are connected
      socket.send(
        JSON.stringify({
          ref: result,
          price,
          unit,
        }),
      );

      clearToText();
    };

    socket.onmessage = event => {
      if (event.data instanceof ArrayBuffer) {
        // binary frame
        const view = new DataView(event.data);
        console.log('received array buffer :', view.getInt32(0));
      } else {
        // text frame
        console.log('received text :', event.data);
      }
    };

    socket.onclose = () => {
      console.log('disconnected');
    };
  };

  const showDialog = isVisible => {
    setDialogVisible(isVisible);
  };

  return (
    <>
      <DialogInput
        isDialogVisible={isDialogVisible}
        title={'Set host IP'}
        message={'Please enter websocket host IP'}
        hintInput={'x.x.x.x'}
        submitInput={(newIP: string) => {
          setHost(newIP);
          showDialog(false);
        }}
        closeDialog={() => {
          showDialog(false);
        }}
      />
      <QRCodeScanner
        ref={scanner}
        onRead={onSuccess}
        flashMode={RNCamera.Constants.FlashMode.off}
        topContent={
          <TouchableOpacity
            onPress={() => showDialog(true)}
            style={styles.buttonTouchable}>
            <Text
              style={
                styles.centerText
              }>{`Set websocket host server IP : ${host}`}</Text>
          </TouchableOpacity>
        }
        bottomContent={
          <>
            <TouchableOpacity
              onPress={onClickPay}
              style={styles.buttonTouchable}>
              <Text style={styles.buttonText}>Pay</Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>
              {price ? (
                <Text>{`Price : ${price} ${unit}\nRef : ${result}`}</Text>
              ) : null}
            </Text>
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  inputHostIP: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    color: '#fff',
    position: 'relative',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 6,
  },
});

export default App;
