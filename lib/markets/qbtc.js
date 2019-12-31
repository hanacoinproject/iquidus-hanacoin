var request = require('request');

var base_url = 'https://www.qbtc.ink/json';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + '/topQuotations.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    // console.log( "get_summary used this url: " + req_url);

    var summary = {};
    request({uri: req_url}, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_summary. Status Code: ' + status);
            return cb(body.error, [], [])
        }
        else {
                var summaryBody = JSON.parse(body)['result'];
                // console.log( "get_summary summary: " + summary);
                summary['bid'] = parseFloat(summaryBody['buyone']).toFixed(8);
                summary['ask'] = parseFloat(summaryBody['sellone']).toFixed(8);
                summary['volume'] = parseFloat(summaryBody['volume']).toFixed(8);
                summary['high'] = parseFloat(summaryBody['high']).toFixed(8);
                summary['low'] = parseFloat(summaryBody['low']).toFixed(8);
                summary['last'] = parseFloat(summaryBody['last']).toFixed(8);
                return cb(null, summary);
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + '/recentDealList.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    // console.log( "get_trades used this url: " + req_url);
    request({uri: req_url}, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_trades. Status Code: ' + status);
            return cb(body.error, [], [])
        } else {
            var tTrades = JSON.parse(body);
            var trades = [];
            if (tTrades['result'] == null) {
                return cb(tTrades, null);
            } else {
                for (var i = 0; i < tTrades['result'].length; i++) {
                    var orderType = tTrades['result'][i].entrustType.toFixed(0);
                    // console.log("get_trades orderType: " + orderType);
                    var date = new Date(tTrades['result'][i].createTime);

                    if (orderType == 1) {
                        order = "Buy";
                    } else {
                        order = "Sell";
                    }
                    var Trade = {
                        ordertype: order,
                        amount: parseFloat(tTrades['result'][i].amount).toFixed(8),
                        price: parseFloat(tTrades['result'][i].price).toFixed(8),
                        total: parseFloat(tTrades['result'][i].totalPrice).toFixed(8),
                        // datetime: tTrades[i].createTime,
                        timestamp: date,
                    }
                    trades.push(Trade);
                }
                return cb(null, trades);
            }
            return cb(body.message, null);
        }
    });
}

function get_orders(coin, exchange, cb) {
    var req_url = base_url + '/depthTable.do?tradeMarket=' + exchange.toUpperCase() + '&symbol=' + coin.toUpperCase();
    // console.log( "get_orders used this url: " + req_url);
    request({uri: req_url}, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_trades. Status Code: ' + status);
            return cb(body.error, [], [])
        } else {
            var orders = JSON.parse(body)['result'];
            // console.log( "get_orders body: " + orders);
            var buys = [];
            var sells = [];
            for (var i = 0; i < orders['buy'].length; i++) {
                buys.push({
                    amount: parseFloat(orders['buy'][i].amount).toFixed(8),
                    price: parseFloat(orders['buy'][i].price).toFixed(8),
                    total: (parseFloat(orders['buy'][i].price).toFixed(8) * parseFloat(orders['buy'][i].amount)).toFixed(8)
                });
            }
            for (var x = 0; x < orders['sell'].length; x++) {
                sells.push({
                    amount: parseFloat(orders['sell'][x].amount).toFixed(8),
                    price: parseFloat(orders['sell'][x].price).toFixed(8),
                    total: (parseFloat(orders['sell'][x].price).toFixed(8) * parseFloat(orders['sell'][x].amount)).toFixed(8)
                });
            }
            return cb(null, buys, sells);
        }
    });
}


module.exports = {
    get_data: function (coin, exchange, cb) {
        var error = null;
        get_orders(coin, exchange, function (err, buys, sells) {
            if (err) {
                error = err;
            }
            get_trades(coin, exchange, function (err, trades) {
                if (err) {
                    error = err;
                }
                get_summary(coin, exchange, function (err, stats) {
                    if (err) {
                        error = err;
                    }
                    return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
                });
            });
        });
    }
};