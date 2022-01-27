const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

const EC = require('elliptic').ec;
const sha256 = require('crypto-js/sha256');
const ec = new EC('secp256k1');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {};
const accounts = [];
const initialBalances = [1000, 500, 100]; 

for (let i = 0; i < initialBalances.length; i++) {
  const key = ec.genKeyPair();
  const privateKey = key.getPrivate('hex');
  const publicKey = key.getPublic('hex');

  accounts[publicKey] = privateKey;
  balances[publicKey] = initialBalances[i];

  console.log(`${i};`);
  console.log(`Private Key: ${privateKey}`);
  console.log(`Public Key: ${publicKey}`);
  console.log(`Balance: ${balances[publicKey]}`);
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  console.log(`/balance/:address => address = ${address}`);

  const balance = balances[address] || 0;

  const pk = accounts[address];

  res.send({ pk, balance });
});

app.post('/send', (req, res) => {

  const { messageString, signature } = req.body;
  const message = JSON.parse(messageString);

  const {sender, recipient, amount} = message;

  const key = ec.keyFromPublic(sender, 'hex');

  const messageDigest = sha256(messageString).toString();

  const verified = key.verify(messageDigest, signature);

  if (verified) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
  } else {
    res.send({
      error: 'Digital signature does not match message.',
    });
  }
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
