/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Basic Treemap
category: treemap
titleCN: 基础矩形树图
*/
option = {
    series: [
        {
            type: 'treemap',
            data: [
                {
                    name: 'nodeA', // First tree
                    value: 10,
                    children: [
                        {
                            name: 'nodeAa', // First leaf of first tree
                            value: 4
                        },
                        {
                            name: 'nodeAb', // Second leaf of first tree
                            value: 6
                        }
                    ]
                },
                {
                    name: 'nodeB', // Second tree
                    value: 20,
                    children: [
                        {
                            name: 'nodeBa', // Son of first tree
                            value: 20,
                            children: [
                                {
                                    name: 'nodeBa1', // Granson of first tree
                                    value: 20
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
