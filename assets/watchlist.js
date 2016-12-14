jQuery(function($){
    $('#stockswatchlist .nav-pills a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })

    $('.sparklines').sparkline('html', { enableTagOptions: true });
    var $search_ticker = $( "#ticker_search" );

    if($search_ticker.length)
    $search_ticker.autocomplete({
        source: function( request, response ) {
            $.ajax( {
                url: "/wp-admin/admin-ajax.php",
                type: 'GET',
                data: {
                    s: request.term,
                    action: 'stock_ticker_search_symbol'
                },
                success: function( data ) {
                    response( data );
                }
            } );
        },
        minLength: 2,
        select: function( event, ui ) {
            $('#ticker_search').val(ui.item.value);
            $('#ticker_search_data').html( 'Fetching Data for <strong>' + ui.item.value + '</strong>' );

            $.ajax( {
                url: "/wp-admin/admin-ajax.php?action=get_stock_data",
                type: 'POST',
                data: {
                    s: ui.item.value
                },
                success: function( data ) {

                    var ticker_data = '';

                    if(data.value!=''){

                        ticker_data = '<strong>Symbol</strong> : ' + data.symbol + '<br>';
                        ticker_data += '<strong>Name</strong> : ' + data.name + '<br><br>';
                        ticker_data += '<div id="ticker_chart" style="height: 400px; width: 100%;"></div>';

                    }

                    $('#ticker_search_data').html(ticker_data);

                    new TradingView.MediumWidget({
                        "container_id": "ticker_chart",
                        "symbols": [
                            [
                                data.name.replace(/[^0-9a-z\s]/gi, ''),
                                data.symbol
                            ]
                        ],
                        "gridLineColor": "#e9e9ea",
                        "fontColor": "#83888D",
                        "underLineColor": "#dbeffb",
                        "trendLineColor": "#4bafe9",
                        "width": "100%",
                        "height": "100%",
                        "locale": "en"
                    });

                }
            });
        }
    }).autocomplete( "instance" )._renderItem = function( ul, item ) {
        return $( "<li>" )
        .append( "<div>" + item.value + "<br>" + item.label + "</div>" )
        .appendTo( ul );
    };;



    $('.stock-table table tr').each(function(){
        var $symbol = $(this).data('symbol');
        var $thisRow = $(this);
        if($symbol && $symbol.length){
            $.ajax( {
                url: "/wp-admin/admin-ajax.php?action=get_stock_data",
                type: 'POST',
                data: {
                    s:$symbol
                },
                success: function( data ) {
                    console.log(data);


                    var statistics = JSON.parse(data.statistics)

                    var $thisRowCells = [];

                    var $latestHistory = data.history[data.history.length - 1] || [];


                    $thisRowCells.push('<td class="value-subdetails"> <label class="lead-text">'+data.symbol+'</label> <small class="help-text">'+data.name+'</small> </td>');
                    $thisRowCells.push('<td class="sparkwrap"><span class="sparklines" data-symbol="'+data.symbol+'"></span></td>');
                    $thisRowCells.push('<td> <button class="btn btn-sm btn-success"><i class="fa fa-dollar"></i> '+parseFloat(statistics.price).toFixed(2)+'</button> </td>');
                    $thisRowCells.push('<td> <button class="btn btn-sm btn-danger"><i class="fa fa-dollar"></i> '+parseFloat(statistics.price).toFixed(2)+'</button> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat(statistics.change).toFixed(2)+'</label> <small class="help-text">'+parseFloat(statistics.change_percent).toFixed(2)+'%</small> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat($latestHistory.high).toFixed(2)+'</label> <small class="help-text">&nbsp;</small> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat($latestHistory.low).toFixed(2)+'</label> <small class="help-text">&nbsp;</small> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat($latestHistory.open).toFixed(2)+'</label> <small class="help-text">&nbsp;</small> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat($latestHistory.close).toFixed(2)+'</label> <small class="help-text">&nbsp;</small> </td>');
                    $thisRowCells.push('<td class="value-subdetails subdetails-right"> <label class="lead-text">'+parseFloat($latestHistory.volume).toFixed(0)+'</label> <small class="help-text">&nbsp;</small> </td>');


                    $thisRow.html($thisRowCells.join(''));
                    var $sparkspan = $thisRow.find('[data-symbol="'+data.symbol+'"]').first();

                    var history = { open : [] , close : [] };
                    for(var i in data.history){
                        history.open.push(parseFloat(data.history[i].open));
                        history.close.push(parseFloat(data.history[i].close));
                    }


                    console.log(history);

                    var $color = {
                        'good' : [ '#a4e2a4' , '#4cae4c' ],
                        'bad' : [ '#d78886' , '#ac2925' ],
                    };

                    var $barcolor = '#ddd';
                    var $linecolor = '#000';

                    if(statistics.change > 0){
                        $barcolor = $color.good[0];
                        $linecolor = $color.good[1];
                    }else{
                        $barcolor = $color.bad[0];
                        $linecolor = $color.bad[1];
                    }

                    $sparkspan.sparkline(history.open, {height: '30px', type: 'bar', barSpacing: 0, barWidth: 3, barColor: $barcolor, tooltipPrefix: 'Open: '});
                    $sparkspan.sparkline(history.close, {composite: true, height: '30px', fillColor:false, lineColor: $linecolor,lineWidth: 2, tooltipPrefix: 'Close: '});
                }
            } );
        }
    });

    $('#add-symbol-to-user').click(function(){
        var $ticker_symbol = $('#ticker_search').val();
        if($ticker_symbol.length){

            $(this).text('Adding Symbol...');
            $(this).addClass('disabled');


            $.ajax( {
                url: "/wp-admin/admin-ajax.php?action=save_stock_data",
                type: 'POST',
                data: {
                    s: $ticker_symbol
                },
                success: function( data ) {
                    console.log(data);

                    $.ajax( {
                        url: "/wp-admin/admin-ajax.php?action=add_stock_data_to_user",
                        type: 'POST',
                        data: {
                            s: $ticker_symbol
                        },
                        success: function( data ) {
                            window.location.reload();
                        },
                        error: function(data) {
                            $(this).text('Add Symbol');
                            $(this).removeClass('disabled');
                            console.log(data);
                        }
                    } );


                }
            } );

        }
    });


    $('.stock-table table').delegate('tr','click',function(){
        var symbol = $(this).data('symbol');
        var thisRow = $(this);

        if(thisRow.hasClass('stock-row') && thisRow.hasClass('open')){
            thisRow.removeClass('open');
            thisRow.next('.chart-row').find('.tab-content,.nav-tabs').slideUp();
            thisRow.next('.chart-row').slideUp();

            return true;
        }

        if(thisRow.hasClass('stock-row') && thisRow.hasClass('loaded') && !thisRow.hasClass('open')){
            thisRow.next('.chart-row').first().find('.tab-content,.nav-tabs').slideDown(function(){
                thisRow.next('.chart-row').first().addClass('open').slideDown(function() {
                    thisRow.addClass('open');
                    thisRow.next('.chart-row').siblings('.chart-row').each(function(i,v){
                        $(v).prev(':not(.chart-row)').removeClass('open');
                        $(v).find('.tab-content,.nav-tabs').slideUp(function(){
                            $(v).slideUp();
                        });
                    });
                });
            });
            return true;
        }

        if(thisRow.hasClass('stock-row') && symbol && symbol.length){

            if($(this).next().first().hasClass('chart-row')) return true;

            $('<tr class="chart-row"><td colspan="10"><ul class="nav nav-tabs nav-justified"> <li><a href="#profile-'+symbol+'" data-toggle="tab">Profile</a></li> <li class="active"><a href="#graph-'+symbol+'" data-toggle="tab">Graph</a></li> </ul> <div class="tab-content"> <div class="tab-pane fade" id="profile-'+symbol+'"><div class="row"> <div class="col-sm-4 text-left"> <label class="bold">Symbol: </label><span class="stock-data-symbol">-</span><br> <label class="bold">Name: </label><span class="stock-data-name">-</span><br> <label class="bold">Type: </label><span class="stock-data-type">-</span><br> <label class="bold">Website: </label><span class="stock-data-website">-</span><br> <label class="bold">Industry: </label><span class="stock-data-industry">-</span><br> </div> <div class="col-sm-4 text-left"> <label class="bold">Address: </label><span class="stock-data-address">-</span><br> <label class="bold">City: </label><span class="stock-data-city">-</span><br> <label class="bold">State: </label><span class="stock-data-state">-</span><br> <label class="bold">Country </label><span class="stock-data-country">-</span><br> <label class="bold">ZIP: </label><span class="stock-data-zip">-</span><br> </div> <div class="col-sm-4 text-left"> <label class="bold">Phone: </label><span class="stock-data-phone">-</span><br> <label class="bold">Sector: </label><span class="stock-data-sector">-</span><br> <label class="bold">Employees: </label><span class="stock-data-employees">-</span><br> </div> <div class="col-sm-12 text-left"> <p style="max-height: 220px; overflow: auto;"> <label class="bold">Summary: </label><br> <span class="stock-data-summary">-</span> </p> </div> </div> </div> <div class="tab-pane fade in active" id="graph-'+symbol+'"> <div id="chart-'+symbol+'" style="width:100%;height:500px;"></div> </div> </div></td></tr>').insertAfter(thisRow);


            $.ajax( {
                url: "/wp-admin/admin-ajax.php?action=get_stock_data",
                type: 'POST',
                data: {
                    s: symbol
                },
                success: function( data ) {

                    $('#profile-'+symbol+' .stock-data-symbol').text(data.symbol);
                    $('#profile-'+symbol+' .stock-data-name').text(data.name);
                    $('#profile-'+symbol+' .stock-data-type').text(data.type);

                    var profile = JSON.parse(data.profile)


                    $('#profile-'+symbol+' .stock-data-summary').text(profile.longBusinessSummary);

                    $('#profile-'+symbol+' .stock-data-address').text(profile.address1);
                    $('#profile-'+symbol+' .stock-data-city').text(profile.city);
                    $('#profile-'+symbol+' .stock-data-state').text(profile.state);
                    $('#profile-'+symbol+' .stock-data-country').text(profile.country);
                    $('#profile-'+symbol+' .stock-data-zip').text(profile.zip);
                    $('#profile-'+symbol+' .stock-data-phone').text(profile.phone);
                    $('#profile-'+symbol+' .stock-data-website').text(profile.website);
                    $('#profile-'+symbol+' .stock-data-industry').text(profile.industry);
                    $('#profile-'+symbol+' .stock-data-sector').text(profile.sector);
                    $('#profile-'+symbol+' .stock-data-employees').text(profile.fullTimeEmployees);

                }
            } );

            $.ajax( {
                url: "/wp-admin/admin-ajax.php?action=get_stock_history",
                type: 'POST',
                data: {
                    s: symbol
                },
                success: function( data ) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].date = new Date(data[i].date.toString());

                        data[i].open = parseFloat(data[i].open);
                        data[i].close = parseFloat(data[i].close);
                        data[i].high = parseFloat(data[i].high);
                        data[i].low = parseFloat(data[i].low);
                        data[i].volume = parseFloat(data[i].volume);
                    }


                    loadChartByID(data,'chart-'+symbol);

                    thisRow.next('.chart-row').first().find('.tab-content,.nav-tabs').slideDown(function(){
                        thisRow.next('.chart-row').first().addClass('open').slideDown(function() {
                            thisRow.addClass('open loaded');
                            thisRow.next('.chart-row').siblings('.chart-row').each(function(i,v){
                                $(v).prev(':not(.chart-row)').removeClass('open');
                                $(v).find('.tab-content,.nav-tabs').slideUp(function(){
                                    $(v).slideUp();
                                });
                            });
                        });
                    });
                }
            } );
        }
    });

    // Load Chart on Element
    function loadChartByID(data,id){
        var chart = AmCharts.makeChart( id , {
            "type": "stock",
            "theme": "light",
            "dataSets": [ {
                "fieldMappings": [ {
                    "fromField": "open",
                    "toField": "open"
                }, {
                    "fromField": "close",
                    "toField": "close"
                }, {
                    "fromField": "high",
                    "toField": "high"
                }, {
                    "fromField": "low",
                    "toField": "low"
                }, {
                    "fromField": "volume",
                    "toField": "volume"
                }, {
                    "fromField": "value",
                    "toField": "value"
                } ],
                "color": "#7f8da9",
                "dataProvider": data,
                "categoryField": "date"
            } ],
            "balloon": {
                "horizontalPadding": 13
            },
            "panels": [ {
                "title": "Value",
                "stockGraphs": [ {
                    "id": "g1",
                    "type": "candlestick",
                    "openField": "open",
                    "closeField": "close",
                    "highField": "high",
                    "lowField": "low",
                    "valueField": "close",
                    "lineColor": "#7f8da9",
                    "fillColors": "#7f8da9",
                    "negativeLineColor": "#db4c3c",
                    "negativeFillColors": "#db4c3c",
                    "fillAlphas": 1,
                    "balloonText": "open:<b>[[open]]</b><br>close:<b>[[close]]</b><br>low:<b>[[low]]</b><br>high:<b>[[high]]</b>",
                    "useDataSetColors": false
                } ]
            } ],
            "scrollBarSettings": {
                "graphType": "line",
                "usePeriod": "DD"
            },
            "panelsSettings": {
                "panEventsEnabled": true
            },
            "cursorSettings": {
                "valueBalloonsEnabled": true,
                "valueLineBalloonEnabled": true,
                "valueLineEnabled": true
            },
            "periodSelector": {
                "position": "bottom",
                "periods": [ {
                    "period": "DD",
                    "count": 7,
                    "label": "1 Week"
                }, {
                    "period": "MM",
                    "count": 1,
                    "selected" : true,
                    "label": "1 Month"
                }, {
                    "period": "YY",
                    "count": 1,
                    "label": "1 Year"
                }, {
                    "period": "MAX",
                    "label": "MAX"
                } ]
            }
        } );
    }

});
