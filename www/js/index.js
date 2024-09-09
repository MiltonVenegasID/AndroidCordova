// (c) 2013-2015 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton, statusDiv */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
/* global cordova, bluetoothSerial  */
/* jshint browser: true , devel: true*/
'use strict';

var app = {
    initialize: function () {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function () {

        var TOUCH_START = 'touchstart';
        if (window.navigator.msPointerEnabled) { // windows phone
            TOUCH_START = 'MSPointerDown';
        }
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener(TOUCH_START, this.refreshDeviceList, false);
        sendButton.addEventListener(TOUCH_START, this.sendData, false);
        disconnectButton.addEventListener(TOUCH_START, this.disconnect, false);
        deviceList.addEventListener('touchstart', this.connect, false);
    },
    onDeviceReady: function () {
        app.refreshDeviceList();
    },
    refreshDeviceList: function () {
        bluetoothSerial.list(app.onDeviceList, app.onError);
    },
    onDeviceList: function (devices) {
        var option;

        // remove existing devices
        deviceList.innerHTML = "";
        app.setStatus("");

        devices.forEach(function (device) {

            var listItem = document.createElement('li'),
                html = '<b>' + device.name + '</b><br/>' + device.id;

            listItem.innerHTML = html;

            if (cordova.platformId === 'windowsphone') {
                // This is a temporary hack until I get the list tap working
                var button = document.createElement('button');
                button.innerHTML = "Connect";
                button.addEventListener('click', app.connect, false);
                button.dataset = {};
                button.dataset.deviceId = device.id;
                listItem.appendChild(button);
            } else {
                listItem.dataset.deviceId = device.id;
            }
            deviceList.appendChild(listItem);
        });

        if (devices.length === 0) {

            option = document.createElement('option');
            option.innerHTML = "No se encuentra ningun dispositivo.\n Por favor, active el Bluetooth.";
            deviceList.appendChild(option);

            if (cordova.platformId === "ios") { // BLE
                app.setStatus("No Bluetooth Peripherals Discovered.");
            } else { // Android or Windows Phone
                app.setStatus("Desconectado");
            }

        } else {
            app.setStatus("Se encontró " + devices.length + " dispositivo" + (devices.length === 1 ? "." : "s."));
        }

    },
    connect: function (e) {
        var onConnect = function () {
            // subscribe for incoming data
            bluetoothSerial.subscribe('\n', app.onData, app.onError);

            resultDiv.innerHTML = "";
            app.setStatus("Conectado");
            app.showDetailPage();
        };

        var deviceId = e.target.dataset.deviceId;
        if (!deviceId) { // try the parent
            deviceId = e.target.parentNode.dataset.deviceId;
        }

        bluetoothSerial.connect(deviceId, onConnect, app.onError);
    },
    onData: function (data) { // data received from Arduino
        console.log(data);

        const delever = data.valueOf();
        console.log(delever);
        var arryBuzz = delever[0] + delever[1];
        var ttalBuzz = parseInt(arryBuzz);
        var arryTemp = delever[4] + delever[5];
        var ttalTemp = parseInt(arryTemp);
        var arryPir = delever[8];
        var ttalPir = parseInt(arryPir);
        var arryHum = delever[11] + delever[12];
        var ttalHum = parseInt(arryHum);
        var arryLuz = delever[18] + delever[19];
        var ttalLuz = parseInt(arryLuz);

        const splitString = data.split(" ");
        console.log(splitString);
        resultDiv1.innerHTML = "Humedad = " + ttalHum + "%";
        resultDiv2.innerHTML = "Temperatura = " + ttalTemp;
        resultDiv3.innerHTML = "Acceso = " + ttalPir;
        resultDiv4.innerHTML = "Buzzer = " + ttalBuzz;
        resultDiv5.innerHTML = "Luz = " + ttalLuz;

        
        if (ttalLuz >= 30) {
            Swal.fire({
                title: 'ADVERTENCIA',
                text: 'Se ha detectado un aumento en la luminosidad del área, encendiendo las luces',
                timer: 5000,
                icon: 'warning',
                timerProgressBar: true,
                allowOutsideClick: false,
                showCancelButton: false,
            })
        }
        if (ttalPir >= 1) {
            Swal.fire({
                title: 'ADVERTENCIA',
                text: 'Se ha detectado movimiento cerca de la entrada, abriendo la puerta',
                timer: 5000,
                icon: 'warning',
                timerProgressBar: true,
                allowOutsideClick: false,
                showCancelButton: false,

            })
        }
        
        if (ttalTemp >= 30) {
            app.sendToArduino("c");
            Swal.fire({
                title: 'ADVERTENCIA',
                text: 'Se ha detectado un aumento en la temperatura, el ventilador será encendido',
                timer: 5000,
                icon: 'warning',
                timerProgressBar: true,
                allowOutsideClick: false,
                showCancelButton: false,

            })
        }
        if (ttalBuzz >= 120) {
            app.sendToArduino("g");
            Swal.fire({
                title: 'ADVERTENCIA',
                text: 'Se ha detectado un aumento en el gas esparcido en el ambiente, activando alarma',
                timer: 5000,
                icon: 'warning',
                timerProgressBar: true,
                allowOutsideClick: false,
                showCancelButton: false,

            })
        }
        if (ttalHum >= 75) {
            Swal.fire({
                title: 'ADVERTENCIA',
                text: 'Se ha detectado un aumento en la humedad del ambiente, activando lcd',
                timer: 5000,
                icon: 'warning',
                timerProgressBar: true,
                allowOutsideClick: false,
                showCancelButton: false,

            })
        };
    },

    disconnect: function (event) {
        bluetoothSerial.disconnect(app.showMainPage, app.onError);
    },
    sendToArduino: function (c) {
        bluetoothSerial.write("c" + c + "\n");
    },
    showMainPage: function () {
        mainPage.style.display = "";
        detailPage.style.display = "none";
    },
    showDetailPage: function () {
        mainPage.style.display = "none";
        detailPage.style.display = "";
    },

    setStatus: function (message) {
        console.log(message);

        window.clearTimeout(app.statusTimeout);
        statusDiv.innerHTML = message;
        statusDiv.className = 'fadein';

        // automatically clear the status with a timer
        app.statusTimeout = setTimeout(function () {
            statusDiv.className = 'fadeout';
        }, 5000);
    },
    onError: function (reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};
$("#apagarven").click(function () {
    app.sendToArduino("d");
});
$("#abrir").click(function () {
    app.sendToArduino("e");
});
$("#cerrar").click(function () {
    app.sendToArduino("f");
});
$("#activar").click(function () {
    app.sendToArduino("k");
});
$("#desactivar").click(function () {
    app.sendToArduino("l");
});
$("#encendido").click(function () {
    app.sendToArduino("i");
});
$("#apagado").click(function () {
    app.sendToArduino("j");
});
$("#cola").click(function () {
    app.sendToArduino("m");
});
$("#mensaje").click(function () {
    app.sendToArduino("h");
});

