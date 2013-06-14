// MtGox API data endpoints:
// https://bitcointalk.org/index.php?topic=150786.0
//
// Streaming:
// https://en.bitcoin.it/wiki/MtGox/API/Streaming

var Utils = {
	digits: function(n) {
		return Math.ceil(Math.log(n+1)/Math.LN10);
	},
	num_short: function(n) {
		n = Math.floor(n);
		var suffii = ['', 'k', 'm', 'b', 't'];
		var sufpos = 0;
		var frac = 0;
		while (Utils.digits(n) >= 4) {
			x = Math.floor(n/1000);
			frac = n - x*1000;
			n = x;
			sufpos++;
		}
		frac = (frac-(frac%100))/100;
		frac = (frac ? '.' + frac : '');
		var res = n + frac + suffii[sufpos];
		return res;
	}
}

var Main = {

	canvas: null,

	canvasdata: {
		pad: {
			top: 10,
			left: 50,
			right: 70,
			bottom: 30
		}
	},

	style: {
		lines: {
			grid:   '#ccc',
			bids:   '#d9642d',
			asks:   '#1c6087',
			trades: '#96c066'
		}
	},

	depth: {
		getting: false,
		url: 'https://data.mtgox.com/api/1/BTCUSD/depth/full',
		data: null,
		range: 60
	},

	trades: {
		getting: false,
		url: 'http://data.mtgox.com/api/1/BTCUSD/trades/fetch',
		data: null
	},

	initialize: function() {
		this.setupCanvas();
		this.getDepth();
		this.getTrades();
	},

	got: function(type) {
		this[type].getting = false;
		if (!this.depth.getting && !this.trades.getting)
			this.redraw();
	},

	setupCanvas: function() {
		this.canvas = $('#depth_canvas canvas')[0];
	},

	setDepthRange: function(r) {
		if (r < 0)
			this.depth.range = Math.ceil(parseFloat(this.trades.data[this.trades.data.length-1].price)*1.95);
		else
			this.depth.range = r;
		this.redraw();
	},

	getDepth: function() {
		this.depth.getting = true;
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
			this.adjustDepthData();
			this.got('depth');
		}
		else {
			this.getDepth_failure();
		}
	},

	getDepth_failure: function(data) {
		console.log('depth data: failed');
	},

	getTrades: function() {
		this.trades.getting = true;
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
			this.got('trades');
		}
		else {
			this.getTrades_failure();
		}
	},

	getTrades_failure: function(data) {
		console.log('trades data: failed');
	},

	// Add additional properties to depth data
	adjustDepthData: function() {
		this.depth.data.bids.reverse();
		this.sum(this.depth.data.bids);
		this.sum(this.depth.data.asks);
	},

	// Any changes that need to be made to trades items?  Do it here
	adjustTradesData: function() {
		// Do nothing
	},

	// Add an amount_sum property to bids and asks
	sum: function(data) {
		for (var i = 0; i < data.length; i++) {
			var cur = data[i];
			var prev = data[i-1];
			cur.amount_sum = cur.amount + (prev ? prev.amount_sum : 0);
			cur.price_sum = (cur.price * cur.amount) + (prev ? (prev.price_sum) : 0);
		}
	},

	getRange: function() {
		var midpoint = (this.depth.data.asks[0].price+this.depth.data.bids[0].price)/2;
		var max = midpoint + this.depth.range/2;
		var min = midpoint - this.depth.range/2;
		return {
			max: max,
			min: min
		}
	},

	getRangeData: function(data) {
		var min = this.getRange().min;
		var max = this.getRange().max;
		var ranged_data = [];
		for (var i = 0; i < data.length; i++) {
			var d = data[i];
			if (d.price >= min && d.price <= max)
				ranged_data.push(d);
		}
		return ranged_data;
	},

	clear: function() {
		var width = this.canvas.width;
		var height = this.canvas.height;
		var c = this.canvas.getContext('2d');
		c.clearRect(0, 0, width, height);
	},

	redraw: function() {
		this.clear();
		this.generateWallData();
		this.drawPriceLines();
		this.drawDepthLines();
		this.drawTradeLine();
		this.drawDepthWalls();
	},

	getCanvasData: function() {
		var cdata    = this.canvasdata;
		var range    = this.getRange();
		cdata.width  = this.canvas.width - (cdata.pad.left + cdata.pad.right);
		cdata.height = this.canvas.height - (cdata.pad.top + cdata.pad.bottom);
		cdata.min    = range.min;  // x axis min
		cdata.max    = range.max;  // x axis max
		return cdata;
	},

	generateWallData: function() {
		var data = {
			bids: this.getRangeData(this.depth.data.bids),
			asks: this.getRangeData(this.depth.data.asks)
		};
		data.depth = Math.max(data.bids[data.bids.length-1].amount_sum, data.asks[data.asks.length-1].amount_sum);
		this.wall_data = data;
	},

	drawDepthWalls: function() {
		this.drawDepthWall('bids');
		this.drawDepthWall('asks');
	},

	drawDepthWall: function(type) {
		var wall_data = this.wall_data[type];

		var cdata = this.getCanvasData();
		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines[type];
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var spot = wall_data[0];
		var x = (parseFloat(spot.price)-cdata.min)/this.depth.range*cdata.width + cdata.pad.left;
		var y = cdata.height + cdata.pad.top;
		c.moveTo(x,y);

		for (var i = 0; spot = wall_data[i]; i++) {
			x = (parseFloat(spot.price)-cdata.min)/this.depth.range*cdata.width + cdata.pad.left;
			c.lineTo(x,y);
			y = cdata.height - (spot.amount_sum/this.wall_data.depth)*cdata.height + cdata.pad.top;
			c.lineTo(x,y);
		}
		c.stroke();
	},

	drawTradeLine: function() {
		var trades = this.trades.data;

		var cdata = this.getCanvasData();
		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines.trades;
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var trade = trades[0];
		var x = (parseFloat(trade.price)-cdata.min)/this.depth.range*cdata.width + cdata.pad.left;
		var y = cdata.pad.top;
		c.moveTo(x,y);

		// Remaining points
		for (var i = 1; trade = trades[i]; i++) {
			x = (parseFloat(trade.price)-cdata.min)/this.depth.range*cdata.width + cdata.pad.left;
			y = (i/trades.length)*cdata.height + cdata.pad.top;
			c.lineTo(x,y);
		}
		c.stroke();
	},

	drawPriceLines: function() {
		var opts = [2,5,10,20,50,100,200,500,1000];
		var est = this.depth.range/10;
		var step = null;
		var step_dist = null;

		for (var i = 0; i < opts.length; i++) {
			var opt = opts[i];
			var dist = Math.abs(est-opt);
			if (!step || dist < step_dist) {
				step = opt;
				step_dist = dist;
			}
		}
		//var n = this.depth.range % step;

		var cdata = this.getCanvasData();
		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines.grid;
		c.fillStyle = '#555';
		c.lineWidth = 1;
		c.font = '13px Helvetica, Arial, Verdana, sans-serif';
		c.textAlign = 'center';
		c.textBaseline = 'top';
		c.beginPath();

		var n = cdata.min - cdata.min%step + step;
		while (n < cdata.max) {
			if (n >= 0) {
				var x = (n-cdata.min)/this.depth.range * cdata.width + cdata.pad.left;
				c.moveTo(x,cdata.pad.top);
				c.lineTo(x,cdata.height+cdata.pad.top);
				c.fillText('$'+n, x, cdata.height+cdata.pad.top+5);
			}
			n += step;
		}
		c.stroke();
	},

	drawDepthLines: function() {
		var opts = [2000,5000,10000,20000,50000,100000,500000,1000000];
		var est = this.wall_data.depth/10;
		var step = null;
		var step_dist = null;

		for (var i = 0; i < opts.length; i++) {
			var opt = opts[i];
			var dist = Math.abs(est-opt);
			if (!step || dist < step_dist) {
				step = opt;
				step_dist = dist;
			}
		}
		var n = this.wall_data.depth % step;

		var cdata = this.getCanvasData();
		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.lines.grid;
		c.fillStyle = '#555';
		c.lineWidth = 1;
		c.font = '13px Helvetica, Arial, Verdana, sans-serif';
		c.textBaseline = 'middle';
		c.beginPath();

		for (var i = 0; i < this.wall_data.depth; i += step) {
			var x1 = cdata.pad.left;
			var x2 = cdata.pad.left + cdata.width;
			var y = cdata.height - i/this.wall_data.depth*cdata.height + cdata.pad.top;
			c.moveTo(x1,y);
			c.lineTo(x2,y);
			if (i > 0) {
				c.textAlign = 'right';
				c.fillText('Ƀ'+Utils.num_short(i), x1-5, y);

				c.textAlign = 'left';
				var usd_spot = this.getSpotAt('ask', i);
				if (usd_spot)
					c.fillText('$'+Utils.num_short(usd_spot.price_sum), x2+5, y);
			}
		}
		c.stroke();
	},

	// Get the bid or ask at the given BTC depth. Can be used to convert to price
	// depth by getting the price_sum of the returned bid or ask.
	getSpotAt: function(type, amount) {
		for (var i = 0; i < this.wall_data.asks.length; i++) {
			var spot = this.wall_data.asks[i];
			if (amount >= spot.amount_sum - spot.amount && amount <= spot.amount_sum) {
				return spot;
			}
		}
		return null;
	}

};

$(Main.initialize.bind(Main));




function DepthCtrl($scope) {
	$scope.setRange = function(r) {
		Main.setDepthRange(r);
	}
}







