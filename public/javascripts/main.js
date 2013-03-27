// MtGox API data endpoints:
// https://bitcointalk.org/index.php?topic=150786.0
//
// Streaming:
// https://en.bitcoin.it/wiki/MtGox/API/Streaming

var Main = {

	canvas: null,

	style: {
		trade_line: {
			color: '#96c066'
		}
	},

	initialize: function() {
		this.setupDepthGraph();
	},

	setupDepthGraph: function() {
		this.canvas = $('#depth')[0];
		this.sortDepthData();
		this.drawDepthData();
	},

	sortDepthData: function() {
		// Asks
		depth.data.asks.sort(function(a,b) {
			return parseInt(a.stamp) - parseInt(b.stamp);
		});
		// Bids
		depth.data.bids.sort(function(a,b) {
			return parseInt(a.stamp) - parseInt(b.stamp);
		});
	},

	drawDepthData: function() {
		this.drawDepthTradeLine();
		this.drawDepthWalls();
	},

	drawDepthTradeLine: function() {
		trades.data.sort(function(a,b) {
			return a.date - b.date;
		});

		var width  = this.canvas.width;
		var height = this.canvas.height;
		var min    = parseFloat(depth.data.filter_min_price.value);
		var max    = parseFloat(depth.data.filter_max_price.value);
		var range  = max - min;

		var c = this.canvas.getContext('2d');
		c.strokeStyle = this.style.trade_line.color;
		c.lineWidth = 1;
		c.beginPath();

		// First point
		var trade = trades.data[0];
		var x = (parseFloat(trade.price)-min)/range*width;
		var y = 0;
		c.moveTo(x,y);

		// Remaining points
		for (var i = 1; trade = trades.data[i]; i++) {
			
			x = (parseFloat(trade.price)-min)/range*width;
			y = (i/trades.data.length)*height;

			c.lineTo(x,y);
		}

		c.stroke();
		console.log('done');
	},

	drawDepthWalls: function() {
		console.log('draw depth walls');
	}

};

$(Main.initialize.bind(Main));