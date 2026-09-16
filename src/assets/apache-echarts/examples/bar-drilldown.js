/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Bar Chart Drilldown Animation
category: bar
titleCN: 柱状图下钻动画
difficulty: 5
*/
option = {
    xAxis: {
        data: ['Animals', 'Fruits', 'Cars']
    },
    yAxis: {},
    dataGroupId: '',
    animationDurationUpdate: 500,
    series: {
        type: 'bar',
        id: 'sales',
        data: [
            {
                value: 5,
                groupId: 'animals'
            },
            {
                value: 2,
                groupId: 'fruits'
            },
            {
                value: 4,
                groupId: 'cars'
            }
        ],
        universalTransition: {
            enabled: true,
            divideShape: 'clone'
        }
    }
};
const drilldownData = [
    {
        dataGroupId: 'animals',
        data: [
            ['Cats', 4],
            ['Dogs', 2],
            ['Cows', 1],
            ['Sheep', 2],
            ['Pigs', 1]
        ]
    },
    {
        dataGroupId: 'fruits',
        data: [
            ['Apples', 4],
            ['Oranges', 2]
        ]
    },
    {
        dataGroupId: 'cars',
        data: [
            ['Toyota', 4],
            ['Opel', 2],
            ['Volkswagen', 2]
        ]
    }
];
myChart.on('click', function (event) {
    if (event.data) {
        var subData = drilldownData.find(function (data) {
            return data.dataGroupId === event.data.groupId;
        });
        if (!subData) {
            return;
        }
        myChart.setOption({
            xAxis: {
                data: subData.data.map(function (item) {
                    return item[0];
                })
            },
            series: {
                type: 'bar',
                id: 'sales',
                dataGroupId: subData.dataGroupId,
                data: subData.data.map(function (item) {
                    return item[1];
                }),
                universalTransition: {
                    enabled: true,
                    divideShape: 'clone'
                }
            },
            graphic: [
                {
                    type: 'text',
                    left: 50,
                    top: 20,
                    style: {
                        text: 'Back',
                        fontSize: 18
                    },
                    onclick: function () {
                        myChart.setOption(option);
                    }
                }
            ]
        });
    }
});
