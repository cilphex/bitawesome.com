// MtGox API data endpoints:
// https://bitcointalk.org/index.php?topic=150786.0
//
// Streaming:
// https://en.bitcoin.it/wiki/MtGox/API/Streaming

var Main = {

	canvas: null,

	range: {
		// None of these are referenced yet, but only depth min/max is used right now
		// (prob should remain that way, cause the walls should be flat against the graph sides)
		trade_min: null,
		trade_max: null,
		depth_min: null,
		depth_max: null,
		fulldepth_min: null,
		fulldepth_max: null
	},

	colors: {
		green: '#96c066',
		blue:  '#009cff',
		wall_fill: '#60889C',
		lines: 'rgba(192,192,192,0.2)'
	},

	initialize: function() {
		this.setupRanges();
		this.pruneDepthData();

		depth.data.bids = depth2.data.bids;
		depth.data.asks = depth2.data.asks;

		this.sortData();
		this.drawDepthGraph();
	},

	// Sort trades, bids, and asks from lowest to highest price
	sortData: function() {
		trades.data.sort(function(a,b) {
			return a.date - b.date;
		});
		depth.data.bids.sort(function(a,b) {
			return a.price - b.price;
		});
		depth.data.asks.sort(function(a,b) {
			return a.price - b.price;
		});
	},

	setupRanges: function() {
		this.range.depth_min = parseFloat(depth.data.filter_min_price.value);
		this.range.depth_max = parseFloat(depth.data.filter_max_price.value);
		for (var i = 0; i < trades.data.length; i++) {
			var price = parseFloat(trades.data[i].price);
			if (!this.range.trade_min || price < this.range.trade_min) this.range.trade_min = price;
			if (!this.range.trade_max || price > this.range.trade_max) this.range.trade_max = price;
		}
		this.range.depth_lower_bound = Math.min(this.range.depth_min, parseFloat(trades.data[trades.data.length-1].price)-20);
		this.range.depth_upper_bound = Math.max(this.range.depth_max, parseFloat(trades.data[trades.data.length-1].price)+20);
	},

	pruneDepthData: function() {
		var bids = [];
		var asks = [];
		for (var i = 0; bid = depth2.data.bids[i]; i++) {
			if (bid.price > this.range.depth_lower_bound)
				bids.push(bid);
		}
		for (var i = 0; ask = depth2.data.asks[i]; i++) {
			if (ask.price < this.range.depth_upper_bound)
				asks.push(ask);
		}
		depth2.data.bids = bids;
		depth2.data.asks = asks;
	},

	drawDepthGraph: function() {
		this.canvas = $('#depth')[0];
		this.drawDepthData();
	},

	drawDepthData: function() {
		this.drawDepthWall('bids');
		this.drawDepthWall('asks');
		this.drawDepthTradeLine();
		this.drawPriceLines();
	},

	drawDepthTradeLine: function() {
		var width     = this.canvas.width;
		var height    = this.canvas.height;
		var min_price = this.range.depth_lower_bound;
		var max_price = this.range.depth_upper_bound;
		var range     = max_price - min_price;

		var c = this.canvas.getContext('2d');
		c.beginPath();
		c.strokeStyle = this.colors.green;
		c.lineWidth = 1;

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
		var min_price  = this.range.depth_lower_bound;
		var max_price  = this.range.depth_upper_bound;
		var range      = max_price - min_price;
		var max_amount = (type == 'bids')
			? trades[0].wall_amount
			: trades[trades.length-1].wall_amount;

		var c = this.canvas.getContext('2d');
		c.beginPath();
		c.strokeStyle = this.colors.blue;
		c.fillStyle = this.colors.wall_fill;
		c.lineWidth = 2;

		var start_x = (type == 'bids') ? 0 : width;
		c.moveTo(start_x,height);

		for (var i = 0; trade = trades[i]; i++) {
			var x = (parseFloat(trade.price)-min_price)/range*width;
			var y = height - (trade.wall_amount/max_amount*height);
			c.lineTo(x,y);
		}
		c.moveTo(start_x,height);
		//c.stroke();
		c.fill();
	},

	// Vertical
	drawPriceLines: function() {
		var width = this.canvas.width;
		var height = this.canvas.height;
		var min_price = this.range.depth_lower_bound;
		var max_price = this.range.depth_upper_bound;
		var range = max_price - min_price;
		var iter = 5;
		var lines = [];
		var first = min_price + (iter-min_price%iter);

		var c = this.canvas.getContext('2d');
		c.beginPath();
		c.strokeStyle = this.colors.lines;
		c.lineWidth = 1;

		for (var price = first; price < max_price; price += iter) {
			console.log('price:', price);
			var x = (price-min_price)/range*width;
			c.moveTo(x,0);
			c.lineTo(x,height);
		}
		c.stroke();
	}
};

$(Main.initialize.bind(Main));

