import "./index.scss";
import { ec as EC } from 'elliptic';
import sha256 from "crypto-js/sha256";

const server = "http://localhost:3042";

const ec = new EC('secp256k1');
let key;

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ pk, balance }) => {
    key = ec.keyFromPrivate(pk, 'hex');
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;

  const message = { sender, amount, recipient };
  const messageString = JSON.stringify(message);
  const messageDigest = sha256(messageString).toString();
  const signature = key.sign(messageDigest).toDer('hex');
  const body = JSON.stringify({ messageString, signature });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }})
    .then(response => {
    return response.json();
    })
    .then(({ response }) => {
      if (typeof response.balance !== 'undefined') {
        document.getElementById("balance").innerHTML = balance;
      } else if (typeof response.error !== 'undefined') {
          window.alert(response.error);
      } else {
        window.alert("Unexpected error occurred");
      }
  });
});