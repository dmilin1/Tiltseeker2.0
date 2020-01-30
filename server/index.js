const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const axios = require('axios');
const dC = require('./dataCollector.js');

const dataCollector = new dC.DataCollector()


startListening = () => {
	const app = express();
	app.use(bodyParser.urlencoded({ extended: false }));
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

	app.get('/api/:region/stats', (req, res) => {
		res.send(dataCollector.stats)
	})

	app.get('/api/:region/*', (req, res) => {
		// Check if region is valid to prevent domain hacks
		if (['na1', 'euw1', 'eun1',
		'br1', 'tr1', 'ru', 'la1',
		'la2', 'oc1', 'kr', 'jp1'].indexOf(req.params.region) === -1) {
			res.status(601).send('invalid region')
			return
		}

		apiRequest = '/' + req.originalUrl.split('/').slice(3).join('/')

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
	  // res.send({
		// 	path: req.originalUrl,
		// 	region: req.params.region,
		// 	request: apiRequest,
		// })
	});



	app.use(express.static(path.join(__dirname, '../build')))

	app.get('*', (req, res) => {
	  res.sendFile(path.join(__dirname+'/../build/index.html'))
	});

	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname+'/../public/index.html'))
	})

	const PORT = process.env.PORT || 3001;
	app.listen(PORT, () =>
	  console.log('Express server is listening on port: ' + PORT)
	);
}

dataCollector.getStats()
.then(() => {
	startListening()
})
.catch((err) => {
	console.log('failed initial stats refresh')
})
