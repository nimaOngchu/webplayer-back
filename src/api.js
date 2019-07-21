const express = require('express');
const serverless = require('serverless-http');
const querystring = require('querystring');
const request = require('request');

const { API_CLIENT_ID, API_CLIENT_SECRET } = process.env
var redirect_uri = 'http://localhost:8888/callback'; 

const app = express();
const router = express.Router();

router.get('/', function(req, res) {

    // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-recently-played user-library-read playlist-read-private user-top-read';
  console.log('api calling inside get')
  res.redirect(

      'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
          response_type: 'code',
          client_id: API_CLIENT_ID,
          scope: scope,
          redirect_uri: redirect_uri
        })
    );
});

router.get('/callback', function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;

      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          Authorization:
            'Basic ' +
            new Buffer(API_CLIENT_ID + ':' + API_CLIENT_SECRET).toString('base64')
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var access_token = body.access_token,
            refresh_token = body.refresh_token;

          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { Authorization: 'Bearer ' + access_token },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect(
            'http://localhost:3000/tokenHandler/#' +
              querystring.stringify({
                access_token: access_token,
                refresh_token: refresh_token
              })
          );
        } else {
          res.redirect(
            '/#' +
              querystring.stringify({
                error: 'invalid_token'
              })
          );
        }
      });
      });

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
