var request = require('request');

function get_summary(coin, exchange, cb) {
    var options = {
        method: 'GET',
        url: 'https://api.probit.com/api/exchange/v1/ticker',
        qs: {market_ids: coin.toUpperCase() + '-' + exchange.toUpperCase()},
    };
    var summary = {};
    request(options, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_summary. Status Code: ' + status);
            return cb(body.error, [], [])
        } else {
                var summaryBody = JSON.parse(body);
                // summary['bid'] = parseFloat(summaryBody['buyone']).toFixed(8);
                // summary['ask'] = parseFloat(summaryBody['sellone']).toFixed(8);
                summary['volume'] = parseFloat(summaryBody['data'][0].base_volume).toFixed(8);
                summary['high'] = parseFloat(summaryBody['data'][0].high).toFixed(8);
                summary['low'] = parseFloat(summaryBody['data'][0].low).toFixed(8);
                summary['last'] = parseFloat(summaryBody['data'][0].last).toFixed(8);
                return cb(null, summary);
            }
    });
}

function get_trades(coin, exchange, cb) {
    var options = {
        method: 'GET',
        url: 'https://api.probit.com/api/exchange/v1/trade',
        qs: {
            market_id: coin.toUpperCase() + '-' + exchange.toUpperCase(),
            start_time: new Date(new Date(new Date()-(24*3600000)).toString().split('GMT')[0]+' UTC').toISOString().split('.')[0] + '.000Z',
            end_time: new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().split('.')[0] + '.000Z',
            limit: '100',
        },
    };
    request(options, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_trades. Status Code: ' + status);
            return cb(body.error, [], [])
        } else {
            var tTrades = JSON.parse(body);
            var trades = [];
            if (tTrades == "null") {
                return cb(tTrades, null);
            } else {
                for (var i = 0; i < tTrades['data'].length; i++) {
                    var Trade = {
                        ordertype: tTrades['data'][i].side,
                        amount: parseFloat(tTrades['data'][i].quantity).toFixed(8),
                        price: parseFloat(tTrades['data'][i].price).toFixed(8),
                        total: (parseFloat(tTrades['data'][i].price).toFixed(8) * parseFloat(tTrades['data'][i].quantity).toFixed(8)),
                        timestamp: tTrades['data'][i].time,
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
    var options = {
        method: 'GET',
        url: 'https://api.probit.com/api/exchange/v1/order_book',
        qs: {market_id: coin.toUpperCase() + '-' + exchange.toUpperCase()},
    };
    request(options, function (error, response, body) {
        var status = JSON.stringify(response.statusCode);
        if ( status !== '200' || body.error ) {
            console.log('Looks like there was a problem with get_orders. Status Code: ' + status);
            return cb(body.error, [], [])
        } else {
            var orders = JSON.parse(body);
            // console.log( "get_orders orders: " + body);
            var buys = [];
            var sells = [];
            for (var i = 0; i < orders['data'].length; i++) {
                if (orders['data'][i].side.toLocaleLowerCase() == "buy"){
                    buys.push({
                        amount: parseFloat(orders['data'][i].quantity).toFixed(8),
                        price: parseFloat(orders['data'][i].price).toFixed(8),
                        total: (parseFloat(orders['data'][i].price).toFixed(8) * parseFloat(orders['data'][i].quantity).toFixed(8))
                    });
                } else {
                    sells.push({
                        amount: parseFloat(orders['data'][i].quantity).toFixed(8),
                        price: parseFloat(orders['data'][i].price).toFixed(8),
                        total: (parseFloat(orders['data'][i].price).toFixed(8) * parseFloat(orders['data'][i].quantity).toFixed(8))
                    });
                }
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