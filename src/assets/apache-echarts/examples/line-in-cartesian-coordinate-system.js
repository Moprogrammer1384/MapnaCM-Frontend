/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Line Chart in Cartesian Coordinate System
category: line
titleCN: 双数值轴折线图
difficulty: 7
*/
option = {
    xAxis: {},
    yAxis: {},
    series: [
        {
            data: [
                [10, 40],
                [50, 100],
                [40, 20]
            ],
            type: 'line'
        }
    ]
};
