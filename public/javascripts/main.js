// MtGox API data endpoints:
// https://bitcointalk.org/index.php?topic=150786.0
//
// Streaming:
// https://en.bitcoin.it/wiki/MtGox/API/Streaming

var Main = {

	canvas: null,

	colors: {
		green: '#96c066',
		blue:  '#009cff'
	},

	initialize: function() {
		this.setupDepthGraph();
	},

	setupDepthGraph: function() {
		this.canvas = $('#depth')[0];
		this.drawDepthData();
	},

	drawDepthData: function() {
		this.drawDepthTradeLine();
		this.drawDepthWall('bids');
		this.drawDepthWall('asks');
	},

	drawDepthTradeLine: function() {
		trades.data.sort(function(a,b) {
			return a.date - b.date;
		});

		var width     = this.canvas.width;
		var height    = this.canvas.height;
		var min_price = parseFloat(depth.data.filter_min_price.value);
		var max_price = parseFloat(depth.data.filter_max_price.value);
		var range     = max_price - min_price;

		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.colors.green;
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var trade = trades.data[0];
		var x = (parseFloat(trade.price)-min_price)/range*width;
		var y = 0;
		c.moveTo(x,y);

		// Remaining points
		for (var i = 1; trade = trades.data[i]; i++) {
			
			x = (parseFloat(trade.price)-min_price)/range*width;
			y = (i/trades.data.length)*height;

			c.lineTo(x,y);
		}
		c.stroke();
	},

	drawDepthWall: function(type) {
		// "trade" in this context means potential trade:
		// a bid (botential buy) or an ask (potential sell)
		var trades = depth.data[type];

		// Sort so they're lowest price to highest price
		trades.sort(function(a,b) {
			return a.price - b.price;
		});

		if (type == 'bids') {
			var start = trades.length - 1;
			var increment = -1;
		}
		else {
			var start = 0;
			var increment = 1;
		}

		trades[start].wall_amount = trades[start].amount;
		for (var i = start+increment; trade = trades[i]; i += increment) {
			var prev_trade = trades[i-increment];
			trade.wall_amount = trade.amount + prev_trade.wall_amount;
		}

		var width      = this.canvas.width;
		var height     = this.canvas.height;
		var min_price  = parseFloat(depth.data.filter_min_price.value);
		var max_price  = parseFloat(depth.data.filter_max_price.value);
		var range      = max_price - min_price;
		var max_amount = (type == 'bids')
			? trades[0].wall_amount
			: trades[trades.length-1].wall_amount;

		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.colors.blue;
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var trade = trades[0];
		var x = (parseFloat(trade.price)-min_price)/range*width;
		var y = height - (trade.wall_amount/max_amount*height);
		c.moveTo(x,y);

		// Remaining points
		for (var i = 0; trade = trades[i]; i++) {
			
			x = (parseFloat(trade.price)-min_price)/range*width;
			y = height - (trade.wall_amount/max_amount*height);

			c.lineTo(x,y);
		}
		c.stroke();
	}
};

$(Main.initialize.bind(Main));

