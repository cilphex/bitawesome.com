// MtGox API data endpoints:
// https://bitcointalk.org/index.php?topic=150786.0
//
// Streaming:
// https://en.bitcoin.it/wiki/MtGox/API/Streaming

var Main = {

	canvas: null,

	style: {
		lines: {
			bids:   '#d9642d',
			asks:   '#1c6087',
			trades: '#96c066'
		}
	},

	depth: {
		url: 'https://data.mtgox.com/api/1/BTCUSD/depth/fetch',
		data: null
	},

	trades: {
		url: 'http://data.mtgox.com/api/1/BTCUSD/trades/fetch',
		data: null
	},

	initialize: function() {
		this.setupCanvas();
		this.getDepth();
		//this.getTrades();
	},

	setupCanvas: function() {
		this.canvas = $('#depth_canvas canvas')[0];
	},

	getDepth: function() {
		$.ajax({
			url:     this.depth.url,
			success: this.getDepth_success.bind(this),
			error:   this.getDepth_failure.bind(this)
		})
	},

	getDepth_success: function(data) {
		console.log('depth data:', data);
		if (data.result && data.result == 'success') {
			this.depth.data = data.return;
			this.depth.data.bids.reverse();
			this.drawDepthWalls();
			this.getTrades();
		}
		else {
			this.getDepth_failure();
		}
	},

	getDepth_failure: function(data) {
		console.log('depth data: failed');
	},

	getTrades: function() {
		$.ajax({
			url:     this.trades.url,
			success: this.getTrades_success.bind(this),
			error:   this.getTrades_failure.bind(this)
		})
	},

	getTrades_success: function(data) {
		console.log('trades data:', data);
		if (data.result && data.result == 'success') {
			this.trades.data = data.return;
			this.drawDepthTradeLine();
		}
		else {
			this.getTrades_failure();
		}
	},

	getTrades_failure: function(data) {
		console.log('trades data: failed');
	},

	/*sortDepthData: function() {
		// Asks
		depth.data.asks.sort(function(a,b) {
			return parseInt(a.stamp) - parseInt(b.stamp);
		});
		// Bids
		depth.data.bids.sort(function(a,b) {
			return parseInt(a.stamp) - parseInt(b.stamp);
		});
	},*/

	drawDepthWalls: function() {
		this.drawDepthWall('bids');
		this.drawDepthWall('asks');
	},

	drawDepthWall: function(type) {
		
		var wall_data = this.depth.data[type];

		var width  = this.canvas.width;
		var height = this.canvas.height;
		var min    = parseFloat(this.depth.data.filter_min_price.value);
		var max    = parseFloat(this.depth.data.filter_max_price.value);
		var range  = max - min;

		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines[type];
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var spot = wall_data[0];
		var x = (parseFloat(spot.price)-min)/range*width;
		var y = height;
		c.moveTo(x,y);

		for (var i = 0; spot = wall_data[i]; i++) {
			x = (parseFloat(spot.price)-min)/range*width;
			c.lineTo(x,y);
			y = height - (i/wall_data.length)*height;
			c.lineTo(x,y);
		}

		c.stroke();
		console.log('done drawing depth wall:');
	},

	drawDepthTradeLine: function() {
		var trades = this.trades.data;

		trades.sort(function(a,b) {
			return a.date - b.date;
		});

		var width  = this.canvas.width;
		var height = this.canvas.height;
		var min    = parseFloat(this.depth.data.filter_min_price.value);
		var max    = parseFloat(this.depth.data.filter_max_price.value);
		var range  = max - min;

		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines.trades;
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var trade = trades[0];
		var x = (parseFloat(trade.price)-min)/range*width;
		var y = 0;
		c.moveTo(x,y);

		// Remaining points
		for (var i = 1; trade = trades[i]; i++) {
			x = (parseFloat(trade.price)-min)/range*width;
			y = (i/trades.length)*height;
			c.lineTo(x,y);
		}

		c.stroke();
		console.log('done drawing trade line');
	}

};

$(Main.initialize.bind(Main));









