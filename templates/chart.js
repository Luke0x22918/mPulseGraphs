var charts = {
    isp_pageload: {
        options: {
            title: "ISP pageload time",
            subtitle: "in ms",
            lineWidth: 1,
            legend: {
                position: "bottom"
            },
            explorer: {}
        },
        type: "Line",
        data: [["Time", "KPN", "Ziggo"]]
    }
};

var settings = {
    percentile: 98,
    canUpdate: true
};


function getISPIndex(isp) {
    isps = charts['isp_pageload']['data'][0]
    for (var i = 0; i < isps.length; i++) {
        if (isps[i] == isp) {
            return i;
        }
    }
}

function dateToTimeStamp(date) {
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    return "{0}:{1}:{2}".format(hours, minutes.substr(-2), seconds.substr(-2));
}

function updateChart(chartName, response, chartInfo) {
    var chartDataArray = charts[chartName]['data'];
    switch (chartName) {
        case "isp_pageload":
            var aPoints = response['series']['series'][0]['aPoints'];
            ispIndex = getISPIndex(chartInfo.name);
            for (var i = 0; i < aPoints.length; i++) {
                var aPoint = aPoints[i];
                var moe = parseFloat(JSON.parse(aPoint['userdata'])['value']); // not sure what to do with this
                var x = aPoint['x'];
                var y = aPoint['y'];
                var date = new Date(x);
                var timestamp = dateToTimeStamp(date);
                var array = charts['isp_pageload']['data'][i+1] || [timestamp];
                array[ispIndex] = y;
                charts['isp_pageload']['data'][i+1] = array;
            }
    }

    if (!chartInfo || (chartInfo['updateChart'] != false)) {
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);
    }
}

// dictionary<string, variant> chartInfo is info about the chart which is used in the updateChart function
function requestData(chartName, parameters, chartInfo=null) {
    $.ajax({
        type: "GET",
        url: "/mPulse/" + parameters,
        xhrFields: {
            withCredentials: false
        },
        success: function(response) {
            try {
                updateChart(chartName, JSON.parse(response), chartInfo);
            }
            catch(error) {
                window.location.href = "/login"
            }
        },

        error: function(responseData) {
            if (chartName == "isp_pageload") {
                // failed to parse the json because series is not in quotes
                jsonTable = responseData.responseText.replace('series:', '"series":');
                repairedResponse = JSON.parse(jsonTable);
                updateChart(chartName, repairedResponse, chartInfo);
            }
        }
    });
}


function updateISP() {
    var isps = charts['isp_pageload']['data'][0];
    for (var i = 1; i < isps.length; i++) {
        var isp = isps[i];
        var updateChart = (i == isps.length-1);
        var chartInfo = {name: isp, updateChart: updateChart};
        var query_string = "by-minute?date-comparator=Last24Hours&series-format=json&timer=PageLoad&percentile={0}&isp={1}".format(settings['percentile'], isp);
        requestData("isp_pageload", query_string, chartInfo);
    }
}


function drawChart() {
    for (var chartName in charts) {
        var chartInfo = charts[chartName];
        if (chartInfo['data'][1]) {
            var data = google.visualization.arrayToDataTable(chartInfo['data']);

            var options = chartInfo['options'];
            var chart;

            if (chartInfo.type == "PieChart") {
                chart = new google.visualization.PieChart(document.getElementById(chartInfo['options']['title']));
            } else if (chartInfo.type == "Line") {
                chart = new google.visualization.LineChart(document.getElementById(chartInfo['options']['title']));
            }

            chart.draw(data, options);
        }
    }
}

var updateButton = document.getElementById("update");;
var percentileButton = document.getElementById("percentile");

window.onclick = function(event) {
    if (!settings['canUpdate']) {
        return
    }

    if (event.target == updateButton) {
        settings['percentile'] = parseInt(percentileButton.value);
        updateISP();
    }
}

updateISP();
