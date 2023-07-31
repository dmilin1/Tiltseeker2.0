require('heroku-self-ping').default('https://tiltseeker.herokuapp.com/')
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const axios = require('axios');
const dC = require('./dataCollector.js');
var CryptoJS = require("crypto-js")

const dataCollector = new dC.DataCollector()

const stripe = require('stripe')(
	process.env.NODE_ENV === 'development' ?
	process.env.STRIPE_SECRET_TEST :
	process.env.STRIPE_SECRET_PROD
, {
	maxNetworkRetries: 3
});


startListening = () => {
	const app = express();
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json())
	app.use((req, res, next) => {

	    // Website you wish to allow to connect
	    res.setHeader('Access-Control-Allow-Origin', '*');

	    // Request methods you wish to allow
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	    // Request headers you wish to allow
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	    // Set to true if you need the website to include cookies in the requests sent
	    // to the API (e.g. in case you use sessions)
	    res.setHeader('Access-Control-Allow-Credentials', true);

	    // Pass to next layer of middleware
	    next();
	});

	app.post('/api/:region/submitDonation', async (req, res) => {
		try {
			const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
			const customer = await stripe.customers.retrieve(session.customer);
			dataCollector.saveDonation({
				session,
				customer,
			})
			res.send({
				session,
				customer,
			})
		} catch (err) {
			res.status(500).send('error while attempting to save donation')
		}
	})

	app.get('/api/:region/getDonations', async (req, res) => {
		try {
			var donations = await dataCollector.getDonations()
			res.send(donations)
		} catch (err) {
			res.status(500).send('error while attempting to fetch donations')
		}
	})

	app.get('/api/:region/stats', (req, res) => {
		res.set('Cache-Control', `public, max-age=${dataCollector.refreshInterval/1000}`);
		res.send({ detailedChampStats: dataCollector.champStats.data, ...dataCollector.stats })
	})

	app.get('/api/:region/*', (req, res) => {
		// Check if region is valid to prevent domain hacks
		if ([
			'na1', 'euw1', 'eun1',
			'br1', 'tr1', 'ru', 'la1',
			'la2', 'oc1', 'kr', 'jp1',
			'americas', 'europe', 'asia',
			'ph2', 'sg2', 'th2','tw2', 'vn2'
		].indexOf(req.params.region) === -1) {
			res.status(601).send('invalid region')
			return
		}

		apiRequest = '/' + req.originalUrl.split('/').slice(3).join('/')

        console.log('https://' + req.params.region + '.api.riotgames.com' + apiRequest)

		axios.get('https://' + req.params.region + '.api.riotgames.com' + apiRequest, {
			headers: {
				'X-Riot-Token': process.env.RIOT_API
			}
		})
		.then((response) => {
			res.send(response.data)
		})
		.catch((err) => {
			res.status(err.response.status).send(err.response.data)
		})
	});



	app.use(express.static(path.join(__dirname, '../build')))

	app.get('/verifier/:fileHash', (req, res) => {
		var license = process.env.LICENSE
	  if (req.params.fileHash != process.env.HASH) {
			console.log(req.params.fileHash)
			license = 'f'
		}
		dataCollector.loginAttempt(req.params.fileHash)
		res.send(CryptoJS.AES.encrypt(license + ',Bc031,ball3,SP101,jc3,', Math.floor(Date.now()/1000000).toString()).toString())
	});

	app.get('/sitemap', (req, res) => {
		console.log(req)
	  res.sendFile(path.join(__dirname+'/../public/sitemap.xml'))
	});

	app.get('*', (req, res) => {
		console.log(req)
	  res.sendFile(path.join(__dirname+'/../build/index.html'))
	});

	app.get('*', (req, res) => {
		console.log(req)
		res.sendFile(path.join(__dirname+'/../public/index.html'))
	})

	const PORT = process.env.PORT || 8080;
	app.listen(PORT, () =>
	  console.log('Express server is listening on port: ' + PORT)
	);
}


startListening()
dataCollector.getStats()
.then(() => {

})
.catch((err) => {
	console.log('failed initial stats refresh')
    console.log(err)
})
