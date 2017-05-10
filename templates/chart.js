var charts = {
    isp_pageload: {
        options: {
            title: "ISP pageload time in ms",
            width: "100%",
            lineWidth: 1,
            legend: {
                position: "bottom"
            },
            explorer: {}
        },
        type: "Line",
        data: [["Time", "KPN", "Ziggo", "Chello", "Xs4all Internet BV", "SURFnet", "Vodafone Libertel B.V."]]
    },
    page_groups: {
        options: {
           title: "Page group info of the last 30 minutes",
           showRowNumber: true, 
           width: '50%', 
           height: '15%'
        },
        columns: [
            ["string", "Page Group"],
            ["number", "Percentage"],
            ["number", "Measurements"]
        ],
        type: "Table",
        data: []
    }
};

var settings = {
    percentile: 50,
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
            var ispIndex = getISPIndex(chartInfo.name);
            for (var i = 0; i < aPoints.length; i++) {
                var aPoint = aPoints[i];
                var x = aPoint['x'];
                var y = Math.min(1e4, aPoint['y']);
                var date = new Date(x);
                var timestamp = dateToTimeStamp(date);
                var array = charts[chartName]['data'][i+1] || [timestamp];
                array[ispIndex] = y;
                charts[chartName]['data'][i+1] = array;
            }
            break;
        case "page_groups":
            var titleText = document.getElementById("page_group_title");
            titleText.innerHTML = "<b>{0}</b>".format(chartInfo['options']['title']);

            var pageGroups = response['data'];
            var newArray = [chartDataArray[0]];

            for (var i = 0; i < pageGroups.length; i++) {
                var pageGroup = pageGroups[i];
                newArray[i] = [
                    pageGroup[0], 
                    {v: parseFloat(pageGroup[4]), f: Math.floor(parseFloat(pageGroup[4])*100)/100 + "%"}, 
                    pageGroup[3]
                ]
            }
            charts[chartName]['data'] = newArray;
    }

    if (!chartInfo || (chartInfo['updateChart'] != false)) {
       google.charts.load('current', {'packages':['bar', 'corechart', 'table']}); 
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
                updateChart(chartName, response, chartInfo);
            }
            catch(error) {
                // If it fails to parse the json, reload the page then a new token cookie will be set.
                console.log(error);
                setTimeout(1000, function() {
                    window.location.href = "/";
                });
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

function updatePageGroups() {
    var chartInfo = {"options": charts['page_groups']['options']};
    var query_string = "page-groups?date-comparator=Last30Minutes&percentile={0}".format(settings['percentile'])
                        + "&page-group=ophalen-rekeningen&page-group=betaalrekening-selecteren&page-group=betalen-tan";
    requestData("page_groups", query_string, chartInfo);
}

function updateCharts() {
    updateISP();
    updatePageGroups();
}

function drawChart() {
    for (var chartName in charts) {
        var chartInfo = charts[chartName];
        if (chartInfo['data'][1]) {
            var options = chartInfo['options'];
            var data;
            var chart;

            if (chartInfo.type == "PieChart") {
                chart = new google.visualization.PieChart(document.getElementById(options['title']));
            } else if (chartInfo.type == "Line") {
                chart = new google.visualization.LineChart(document.getElementById(options['title']));
            } else if (chartInfo.type == "Table") {
                var data = new google.visualization.DataTable();
                var columns = chartInfo.columns;
                for (var i = 0; i < columns.length; i++) {
                    data.addColumn(columns[i][0], columns[i][1]);
                }
                var rows = chartInfo['data']; 
                data.addRows(rows);
                chart = new google.visualization.Table(document.getElementById(options['title']));
            }

            data = data || google.visualization.arrayToDataTable(chartInfo['data']);
            chart.draw(data, options);
        }
    }
}

var updateButton = document.getElementById("update");
var percentileButton = document.getElementById("percentile");

window.onclick = function(event) {
    if (!settings['canUpdate']) {
        return
    }

    if (event.target == updateButton) {
        settings['percentile'] = parseInt(percentileButton.value);
        percentileButton.placeholder = percentileButton.value;
        updateCharts();
    }
}

updateCharts();

