/* jshint node: false, browser: true, devel: true, undef: true, esversion: 5, latedef: nofunc, unused: true  */

/*
    
    Copyright 2017 Emil Hemdal (https://emil.hemdal.se/)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/


(function() {
    'use strict';

    var canvas = {};

    canvas.ui = document.getElementById('ui');
    canvas.graphs = document.getElementById('graphs');

    var ctx = {};

    ctx.ui = canvas.ui.getContext('2d');
    ctx.graphs = canvas.graphs.getContext('2d');

    var graphs = [
        {
            name: 'xt',
            x: 5,
            y: 5,
            width: 250,
            height: 150,
            func: 'x(t)',
            varx: 't',
            mousemove: drawGraph,
            render: renderMousedGraphs,
            color: 'blue',
            graph: [],
        },
        {
            name: 'ht',
            x: 265,
            y: 5,
            width: 250,
            height: 150,
            func: 'h(t)',
            varx: 't',
            mousemove: drawGraph,
            render: renderMousedGraphs,
            color: 'red',
            graph: [],
        },
        {
            name: 'x(t-v) and h(v)',
            x: 5,
            y: 165,
            width: 510,
            height: 150,
            func: 'x(t-v) and h(v)',
            varx: 'v',
            mousemove: timeShiftGraph,
            render: renderTimeShift,
            color: 'red',
            graph: [],
        },
        {
            name: 'x(t - v) h(v)',
            x: 5,
            y: 325,
            width: 510,
            height: 150,
            func: 'x(t - v) h(v)',
            varx: 'v',
            mousemove: timeShiftGraph,
            render: renderCombination,
            color: 'black',
            graph: [],
        },
        {
            name: 'y(t) = ∫ h(v) x(t - v) dv',
            x: 5,
            y: 485,
            width: 510,
            height: 150,
            func: 'y(t) = ∫ h(v) x(t - v) dv',
            varx: 't',
            mousemove: timeShiftGraph,
            render: renderCombination,
            color: 'black',
            graph: [],
        },
    ];

    var precalculatedZero;
    for (var i = graphs.length - 1; i >= 0; i--) {

        renderCoordinatePlane(graphs[i].x, graphs[i].y, graphs[i].width,
            graphs[i].height, graphs[i].func, graphs[i].varx);

        if(graphs[i].mousemove !== drawGraph || graphs[i].func === 'x(t - v) h(v)') {
            continue;
        }

        precalculatedZero = calculateCanvasPos(0, graphs[i].height);
        
        for (var j = 0; j <= graphs[i].width; j++) {
            graphs[i].graph.push(precalculatedZero);
        }
    }

    var mouseDown = false;
    var startedIn = null;
    var previousMouse = [null, null];
    var timeshift = 125;
    var selectedGraphs = ['xt', 'ht']; // Order matter. First will follow mouse.

    canvas.ui.addEventListener('mousemove', function( e ) {
        var i;
        if(mouseDown && startedIn != null) {
            for (i = graphs.length - 1; i >= 0; i--) {
                if(graphs[i].name === startedIn) {
                    if(graphs[i].mousemove) {
                        graphs[i].mousemove(graphs[i], e.layerX, e.layerY);
                    }
                    break;
                }
            }
        }
    }, false);
    canvas.ui.addEventListener('mousedown', function( e ) {
        mouseDown = true;
        for (var i = graphs.length - 1; i >= 0; i--) {
            if(graphs[i].x + 1 <= e.layerX && e.layerX <= graphs[i].x + graphs[i].width - 1 &&
                graphs[i].y <= e.layerY && e.layerY <= graphs[i].y + graphs[i].height) {
                console.log(graphs[i].name);
                startedIn = graphs[i].name;
                previousMouse = [e.layerX - graphs[i].x, e.layerY - graphs[i].y];
                if(graphs[i].mousemove) {
                    graphs[i].mousemove(graphs[i], e.layerX, e.layerY);
                }
            }
        }
    }, false);
    document.addEventListener('mouseup', function( /* e */ ) {
        mouseDown = false;
        startedIn = null;
        previousMouse = [null, null];
    }, false);

    function drawGraph(graph, mX, mY) {
        var currentMouse = [null, null];
        var j, diff, m, k, endForVal;
        currentMouse[0] = mX - graph.x;
        currentMouse[1] = mY - graph.y;
        if(graph.x + 1 <= mX && mX <= graph.x + graph.width - 1) {
            diff = currentMouse[0] - previousMouse[0];
            //console.log('x', previousMouse[0], 'y', previousMouse[1],
            //    'x', currentMouse[0], 'y', currentMouse[1], diff);
            if(Math.abs(diff) > 1) {
                //console.log(diff);
                m = ((currentMouse[1]) - previousMouse[1]) / ((currentMouse[0]) - previousMouse[0]);
                k = (currentMouse[1] - m * currentMouse[0]);
                endForVal = diff < 0 ? 0 : diff;
                for (j = (diff < 0 ? diff : 1); j < endForVal; j++) {
                    if(0 < previousMouse[0] + j && previousMouse[0] + j < graph.width) {
                        graph.graph[previousMouse[0] + j] = Math.min(Math.max(m * (previousMouse[0] + j) + k, 0), graph.height);
                    }
                }
            }
            if(currentMouse[1] < 0) {
                graph.graph[currentMouse[0]] = 0;
            } else if(currentMouse[1] > graph.height) {
                graph.graph[currentMouse[0]] = graph.height;
            } else {
                graph.graph[currentMouse[0]] = currentMouse[1];
            }
        }
        previousMouse = [currentMouse[0], currentMouse[1]];
    }

    function timeShiftGraph(graph, mX/*, mY*/) {
        timeshift = Math.min(Math.max(mX - graph.x, 0), graph.width - 1);
    }

    function renderCoordinatePlane(x, y, width, height, func, varx) {
        var prevFont = ctx.ui.font,
            prevFillStyle = ctx.ui.fillStyle,
            prevStrokeStyle = ctx.ui.strokeStyle;
        ctx.ui.font = '10px sans-serif';
        ctx.ui.fillStyle = 'white';
        ctx.ui.fillRect(x, y, width, height);
        ctx.ui.fillStyle = 'gray';
        ctx.ui.strokeStyle = 'gray';
        ctx.ui.beginPath();
        ctx.ui.lineWidth = 1;
        ctx.ui.moveTo(x, Math.round(y+height/2) + 0.5);
        ctx.ui.lineTo(x+width, Math.round(y+height/2) + 0.5);
        ctx.ui.moveTo(Math.round(x+width/2) + 0.5, y);
        ctx.ui.lineTo(Math.round(x+width/2) + 0.5, y+height);

        ctx.ui.moveTo(x+width/2 - 3, y+Math.round(height/4) + 0.5);
        ctx.ui.lineTo(x+width/2 + 4, y+Math.round(height/4) + 0.5);
        ctx.ui.fillText('+1', x+width/2+5, y+Math.round(height/4) + 4);
        ctx.ui.moveTo(x+width/2 - 3, y+Math.round(height/4 * 3) + 0.5);
        ctx.ui.lineTo(x+width/2 + 4, y+Math.round(height/4 * 3) + 0.5);
        ctx.ui.fillText('-1', x+width/2+5, y+Math.round(height/4 * 3) + 3);
        ctx.ui.stroke();

        ctx.ui.fillText(func, x+3, y+12);
        ctx.ui.fillText(varx, x+width - 6, y+Math.round(height/2) + 9);
        ctx.ui.font        = prevFont;
        ctx.ui.strokeStyle = prevStrokeStyle;
        ctx.ui.fillStyle   = prevFillStyle;
    }

    function renderTimeShift(graph) {
        var i, k, first;
        for (i = graphs.length - 1; i >= 0; i--) {
            ctx.graphs.strokeStyle = graphs[i].color;
            ctx.graphs.beginPath();
            if(graphs[i].name === selectedGraphs[0]) {
                first = true;
                for (k = graphs[i].width; k >= 0; k--) {
                    if(0 <= timeshift - graphs[i].width / 2 + (graphs[i].width - k) && timeshift - graphs[i].width / 2 + (graphs[i].width - k) <= graph.width) {
                        if(first) {
                            //ctx.graphs.moveTo(Math.min(Math.max(graph.x + timeshift - graphs[i].width / 2, graph.x), graph.x + graph.width),
                            //graph.y + graphs[i].graph[i]);
                            ctx.graphs.moveTo(graph.x + timeshift - graphs[i].width / 2 + (graphs[i].width - k), graph.y + graphs[i].graph[k]);
                            first = false;
                        } else {
                            ctx.graphs.lineTo(graph.x + timeshift - graphs[i].width / 2 + (graphs[i].width - k), graph.y + graphs[i].graph[k]);
                        }
                    }
                }
                ctx.graphs.stroke();
                ctx.graphs.strokeStyle = 'gray';
                ctx.graphs.fillStyle = 'gray';
                ctx.graphs.beginPath();
                ctx.graphs.moveTo(graph.x + timeshift + 0.5, graph.y + graph.height / 2 - 3);
                ctx.graphs.lineTo(graph.x + timeshift + 0.5, graph.y + graph.height / 2 + 4);
                ctx.graphs.stroke();
                ctx.graphs.font = '10px sans-serif';
                ctx.graphs.fillText('t', graph.x + timeshift + 2, graph.y + graph.height / 2 + 10);
            } else if(graphs[i].name === selectedGraphs[1]) {
                ctx.graphs.moveTo(graph.x + graph.width / 2 - graphs[i].width / 2, graph.y + graphs[i].graph[0]);
                for (k = 1; k <= graphs[i].width; k++) {
                    ctx.graphs.lineTo(graph.x + graph.width / 2 - graphs[i].width / 2 + k, graph.y + graphs[i].graph[k]);
                }
                ctx.graphs.stroke();
            }
        }
    }

    function renderCombination(graph) {
        var i, firstGraph, secondGraph, firstVal, secondVal;
        for (i = graphs.length - 1; i >= 0; i--) {
            if(graphs[i].name === selectedGraphs[0]) {
                firstGraph = graphs[i];
            } else if(graphs[i].name === selectedGraphs[1]) {
                secondGraph = graphs[i];
            }
        }
        /*console.log(timeshift - firstGraph.width / 2, timeshift,
            125 - (timeshift - firstGraph.width / 2),
            125 - secondGraph.width / 2);*/
        ctx.graphs.strokeStyle = graph.color;
        ctx.graphs.beginPath();
        for(i = 0; i <= graph.width; i++) {
            firstVal = i - (timeshift - firstGraph.width / 2) >= 0 && i - (timeshift - firstGraph.width / 2) <= firstGraph.width ?
                firstGraph.graph[firstGraph.width - (i - (timeshift - firstGraph.width / 2))] : Math.round(firstGraph.height / 2) + 0.5;
            secondVal = i - (secondGraph.width / 2) >= 0 && i - (secondGraph.width / 2) <= secondGraph.width ?
                secondGraph.graph[i - (secondGraph.width / 2)] : Math.round(secondGraph.height / 2) + 0.5;
            if(i === 0) {
                ctx.graphs.moveTo(graph.x + i, graph.y + calculateCanvasPos(calculateGraphPos(firstVal, firstGraph.height) * calculateGraphPos(secondVal, secondGraph.height), graph.height));
            } else {
                ctx.graphs.lineTo(graph.x + i, graph.y + calculateCanvasPos(calculateGraphPos(firstVal, firstGraph.height) * calculateGraphPos(secondVal, secondGraph.height), graph.height));
            }
            //console.log(calculateCanvasPos(calculateGraphPos(firstVal, firstGraph.height) * calculateGraphPos(secondVal, secondGraph.height), graph.height));
        }
        ctx.graphs.stroke();
    }

    function renderConvolutionIntegral(graph) {
        
    }

    function renderMousedGraphs(graph) {
        ctx.graphs.strokeStyle = graph.color;
        ctx.graphs.beginPath();
        ctx.graphs.moveTo(graph.x, graph.y + graph.graph[0]);
        for (var j = 1; j <= graph.width; j++) {
            ctx.graphs.lineTo(graph.x + j, graph.y + graph.graph[j]);
        }
        ctx.graphs.stroke();
    }

    function renderGraphs() {
        ctx.graphs.clearRect(0, 0, canvas.graphs.width, canvas.graphs.height);
        ctx.graphs.lineWidth = 1;
        for (var i = graphs.length - 1; i >= 0; i--) {
            if(graphs[i].render) {
                graphs[i].render(graphs[i]);
            }
        }
    }

    function calculateCanvasPos(graphY, height) {
        // So to explain the conversion
        // height / 2 places us in the middle of the graph
        // height / (2 * 2) scales the actual graph.
        //               ^ that 2 sets the maximum point on the graph.
        return Math.round(height / 2) + 0.5 - height / (2 * 2) * graphY;
    }

    function calculateGraphPos(canvasY, height) {
        // So to explain the conversion
        // height / 2 places us in the middle of the graph
        // height / (2 * 2) scales the actual graph.
        //               ^ that 2 sets the maximum point on the graph.
        return -(canvasY - (Math.round(height / 2) + 0.5)) / (height / (2 * 2));
    }

    function testConvertionGraphCanvas(Y, h) {
        //console.log(calculateGraphPos(calculateCanvasPos(Y, h), h));
        return Y === calculateCanvasPos(calculateGraphPos(Y, h), h);
    }

    function testConvertionCanvasGraph(Y, h) {
        //console.log(calculateGraphPos(calculateCanvasPos(Y, h), h));
        return Y === calculateGraphPos(calculateCanvasPos(Y, h), h);
    }

    function fullTestConversion() {
        var height = 250;
        var i;
        for (i = 0; i < height; i++) {
            if(!testConvertionGraphCanvas(i, height)) {
                console.log('oops! graphcanvas!', i);
                break;
            }
        }
        for (i = 0; i < height; i++) {
            if(!testConvertionCanvasGraph(calculateGraphPos(i, height), height)) {
                console.log('oops! canvasgraph!', i);
                break;
            }
        }
        console.log('Success!');
    }

    //fullTestConversion();

    //console.log(calculateGraphPos(125.5, 250));

    //testConvertion(125.5, 250);

    setInterval(renderGraphs, 8);

    /*setTimeout(function() {
        console.log(graphs);
    }, 2000);*/

})();
