var charts = {
    isp_pageload: {
        options: {
            title: "ISP pageload time",
            subtitle: "in ms",
            lineWidth: 1,
            legend: {
                position: "bottom"
            },
        },
        type: "Line",
        data: [["Time", "KPN", "Ziggo", "Xs4all Internet BV"]]
    }
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
        url: "http://localhost:8000/" + parameters,
        xhrFields: {
            withCredentials: false
        },
        success: function(response){
            updateChart(chartName, response, chartInfo);
        },

        error: function(responseData){
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
        var chartInfo = {name: isp, updateChart:updateChart};
        requestData("isp_pageload", "by-minute?date-comparator=Last24Hours&series-format=json&isp="+isp, chartInfo);
    }
}

updateISP();

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


