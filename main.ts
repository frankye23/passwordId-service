import express from 'express';
import cors from 'cors';

import { server } from '@passwordless-id/webauthn'
import * as crypto from 'crypto'
import * as fs from 'fs'
import userInfo from './user.json' assert { type: "json" };

function randomChallenge() {
  console.log(crypto.randomUUID())
  return crypto.randomUUID()
}

function saveUserCredentialToJson(credential: any) {
  fs.readFile('user.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
  
    // 解析json数据
    let jsonData = JSON.parse(data);
  
    // 添加新的内容到json数组中
    jsonData.push(credential);
  
    // 将修改后的json数据转为字符串
    let updatedData = JSON.stringify(jsonData);
  
    // 将更新后的数据写入json文件
    fs.writeFile('user.json', updatedData, 'utf8', err => {
      if (err) {
        console.error(err);
        return;
      }
  
      console.log('内容已成功添加到json文件中。');
    });
  });
}

const app: express.Application = express();

app.use(express.json());
app.use(cors());

app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send('（￣▽￣）～■□～（￣▽￣）干杯！！！')
});

// return the challenge
app.get('/challenge', (req: express.Request, res: express.Response) => {
  res.status(200).send(randomChallenge())
});

// return registered credentials
app.get('/credentials', async (req: any, res: express.Response) => {
  const expected = {
    challenge: req.query.challenge,
    origin: req.query.origin,
  }

  console.log(JSON.parse(req.query.registration))
  const registrationParsed = await server.verifyRegistration(JSON.parse(req.query.registration), expected)
  // store the credentials of registrationParsed in local json file user.json
  saveUserCredentialToJson(registrationParsed.credential)

  res.status(200).send({
    data: registrationParsed,
    msg: 'success'
  });
});

// verify authentication
app.get('/authentication', (req: any, res: express.Response) => {
  console.log(userInfo)
  // use req.query.credentialId to find the credential in local json file user.json
  const credential = userInfo.find((item: any) => item.id === req.query.credentialId) as any
  console.log(credential)

  if(!credential) {
    res.status(400).send({
      msg: 'credential not found' 
    });
    return
  }

  const expected = {
    challenge: req.query.challenge, // whatever was randomly generated by the server.
    origin: req.query.origin,
    userVerified: true, // should be set if `userVerification` was set to `required` in the authentication options (default)
    counter: -1 // for better security, you should verify the authenticator "usage" counter increased since last time
  }
  console.log(11111, req.query.authentication)

  server.verifyAuthentication(JSON.parse(req.query.authentication), credential, expected)
    .then((result: any) => {
      res.status(200).send({
        data: result,
        msg: 'success'
      });
    })
});

app.listen(9999, function () {
  console.log('api server running at http://127.0.0.1:9999')
})