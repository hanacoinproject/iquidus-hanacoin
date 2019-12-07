var request = require('request');

var base_url = 'https://www.qbtc.ink/json';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + '/topQuotations.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    console.log( "get_summary used this url: " + req_url);

    var summary = {};
    request({uri: req_url}, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else {
            if (body.error) {
                return cb(body.error, null);
            } else {
                console.log( "get_summary summary: " + summary);
                summary['bid'] = parseFloat(body['ticker']['buyone']).toFixed(8);
                summary['ask'] = parseFloat(body['ticker']['sellone']).toFixed(8);
                summary['volume'] = parseFloat(body['ticker']['volume']).toFixed(8);
                // summary['volume_btc'] = parseFloat(body['ticker']['quotevol']).toFixed(8);
                summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
                summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
                summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
                // request({ uri: base_url + 'k?market=' + coin.toLowerCase() + "" + exchange.toLowerCase() + '&period=1&time_to=' + (Math.round(Date.now()/1000)-(60*60*24)) + '&limit=1', json: true }, function (error, response, body) {
                //     if (error) {
                //         return cb(error, null);
                //     } else {
                //         if (body.error) {
                //             return cb(body.error, null);
                //         } else {
                //             var prevlast = body[0][4];
                //             summary['change'] = -(100-(((1/prevlast)*summary['last'])*100));
                //             return cb(null, summary);
                //         }
                //     }
                // });
            }
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + '/recentDealList.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    console.log( "get_trades used this url: " + req_url);
    request({uri: req_url}, function (error, response, body) {
        if (body.error) {
            return cb(body.error, null);
        } else {
            console.log( "get_trades body: " + body);
            return cb (null, body);
        }
    });
}

function get_orders(coin, exchange, cb) {
    var req_url = base_url + '/depthTable.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    console.log( "get_orders used this url: " + req_url);
    request({uri: req_url},function (error, response, body) {
        if (body.error) {
            return cb(body.error, [], [])
        } else {
            var orders = body;
            console.log( "get_orders body: " + orders);
            var buys = [];
            var sells = [];
            // if (orders['result'].length > 0){
                for (var i = 0; i < orders.result['buy'].length; i++) {
                    var order = {
                        amount: parseFloat(orders.buy[i][1]).toFixed(8),
                        price: parseFloat(orders.buy[i][0]).toFixed(8),
                        //  total: parseFloat(orders.bids[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.buy[i][1]).toFixed(8) * parseFloat(orders.buy[i][0])).toFixed(8)
                    }
                    buys.push(order);
                }
            // } else {}
            // if (orders['sell'].length > 0) {
                for (var x = 0; x < orders['sell'].length; x++) {
                    var order = {
                        amount: parseFloat(orders.sell[x][1]).toFixed(8),
                        price: parseFloat(orders.sell[x][0]).toFixed(8),
                        //    total: parseFloat(orders.asks[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.sell[x][1]).toFixed(8) * parseFloat(orders.sell[x][0])).toFixed(8)
                    }
                    sells.push(order);
                }
            // } else {}
            return cb(null, buys, sells);
        }
    });
}

module.exports = {
    get_data: function(coin, exchange, cb) {
        var error = null;
        get_orders(coin, exchange, function(err, buys, sells) {
            if (err) { error = err; }
            get_trades(coin, exchange, function(err, trades) {
                if (err) { error = err; }
                get_summary(coin, exchange, function(err, stats) {
                    if (err) { error = err; }
                    return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
                });
            });
        });
    }
};