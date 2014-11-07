var paths = [],
	offList = {},
	solutions = [],
	multi = 10,
	solutionLow = Number.MAX_SAFE_INTEGER;

function checkDist(path){
	var dist = 0;

	path.forEach(function(con){
		dist += paths[con[0]][con[1]];
	});

	return dist;
}

function deepCopy(arr){
	return arr.map(function(sub){
		return sub.slice();
	});
}

function toPair(row, col){
	return col.map(function(e, idx){
		return [col.indexOf(idx+1), row.indexOf(idx+1)];
	});
}

function fromPairs(pairs){
	var find = 0,
		was = [],
		list = [],
		len = pairs.length,
		curr;

	for(var i=0; i<len; i++){
		list.push(find);

		for(var j=0; j<len; j++){
			if(was[j])
				continue;

			curr = pairs[j];
			if(curr[0]===find){
				was[j] = true;
				find = curr[1];
				break;
			}else if(curr[1]===find){
				was[j] = true;
				find = curr[0];
				break;
			}
		}
	}

	return list;
}

function hamiltonCycle(pairs){
	var find = 0,
		was = [],
		len = pairs.length,
		curr;

	for(var i=0; i<len; i++){
		for(var j=0; j<len; j++){
			if(was[j])
				continue;

			curr = pairs[j];
			if(curr[0]===find){
				if(was[j])
					return false;

				was[j] = true;
				find = curr[1];
				break;
			}else if(curr[1]===find){
				if(was[j])
					return false;

				was[j] = true;
				find = curr[0];
				break;
			} else if(j===len-1)
				return false;
		}
	}

	return true;
}

function checkOffList(){
	Object.keys(offList).forEach(function(low){
		var next;

		if(low<solutionLow)
			while(next = offList[low].pop()){
				find4(next.paths, next.row, next.col, next.limit, next.iter);
			}
	});
}

function endTree2(paths, col, row, lowLimit, iter){
	var x1 = col.indexOf(-1),
		x2 = col.lastIndexOf(-1),
		y1 = row.indexOf(-1),
		y2 = row.lastIndexOf(-1),
		len = solutions.length,
		pairs;


	lowLimit += paths[x1][y1] + paths[x2][y2];

	col = col.slice();
	row = row.slice();
	row[y1] = ++iter;
	col[x1] = iter;
	row[y2] = ++iter;
	col[x2] = iter;

	pairs = toPair(row, col);

	//console.log(pairs);
	//if(!hamiltonCycle(pairs))
	//	return;
	//console.log('pass');

	if(len && solutions[0].limit>lowLimit || !len){
		solutions = [];
		solutionLow = lowLimit;
	}else
		return;

	console.log(JSON.stringify(pairs));

	solutions.push({
		pairs: pairs,
		limit: lowLimit
	});
}

function showPaths(paths, row, col){
	 var len = paths.length,
	 ret = [],
	 s;

	 for(var r=0; r<len; r++){
	 	if(row[r]!==-1)
	 		continue;

		s = [];
		ret.push(s);

		for(var c=0; c<len; c++){
			if(col[c]!==-1)
				continue;

			s.push(paths[r][c]);
		}
	 }

	console.log(ret);
}

function offTree2(paths, off, r, c, row, col, lowLimit, iter, rmod, cmod){
	col = col.slice();
	row = row.slice();
	paths = deepCopy(paths);

	//console.log('kuk');
	//showPaths(paths, row, col);

	if(off) {
		lowLimit +=	rmod + cmod;

		paths[r][c] = Number.MAX_SAFE_INTEGER;

		var len = col.length;

		for(var idr=0; idr<len; idr++) {
			if(idr === c || row[idr]!==-1)
				continue;

			paths[idr][c] -= cmod;
		}

		for(var idc=0; idc<len; idc++) {
			if(idc === r || col[idc]!==-1)
				continue;

			paths[r][idc] -= rmod;
		}

		var ele = {
			limit: lowLimit,
			paths: paths,
			row: row,
			col: col,
			iter: iter,
			tested: false
		};

		if(lowLimit in offList)
			offList[lowLimit].push(ele);
		else
			offList[lowLimit] = [ele];
	} else {
		col[c] = ++iter;
		row[r] = iter;

		//blokada powrotu
		paths[c][r] = Number.MAX_SAFE_INTEGER;

		find4(paths, row, col, lowLimit, iter);
	}
}

function find4(paths, row, col, lowLimit, iter){
	var len = paths.length,
		max = Number.MAX_SAFE_INTEGER,
		colmin = [max],
		colmin2 = [max],
		rowNull,
		rowmin = [],
		rowmax = 0,
		colmax = 0,
		colNull = [],
		rcmax,
		min;

	if(iter === len-2)
		return endTree2(paths, row, col, lowLimit, iter);

	for(var c=0; c<len; c++){
		colmin[c] = max;
		colmin2[c] = max;
	}

	/**
	 * skracanie
	 */
	for(var r=0; r<len; r++){
		if(row[r]!==-1)
			continue;

		min = max;

		for(c=0; c<len; c++){
			if(c === r || col[c]!==-1)
				continue;

			min = Math.min(min, paths[r][c]);
		}

		for(c=0; c<len; c++){
			if(c === r || col[c]!==-1)
				continue;

			paths[r][c] -= min;

			colmin[c] = Math.min(colmin[c], paths[r][c]);
		}

		lowLimit += min;
	}

	for(c=0; c<len; c++){
		if(col[c]!==-1)
			continue;

		lowLimit += colmin[c];
	}

	for(r=0; r<len; r++) {
		if(row[r]!==-1)
			continue;

		for(c=0; c<len; c++) {
			if(c === r || col[c]!==-1)
				continue;

			paths[r][c] -= colmin[c];
		}
	}

	/**
	 * redukcja
	 */
	for(r=0; r<len; r++) {
		if(row[r]!==-1)
			continue;

		rowNull = false;
		min = max;

		for(c=0; c<len; c++) {
			if(c === r || col[c]!==-1)
				continue;

			if(!rowNull && !paths[r][c])
				rowNull = true;
			else
				min = Math.min(paths[r][c], min);

			if(!colNull[c] && !paths[r][c]){
				colNull[c] = true;
			} else{
				colmin2[c] = Math.min(colmin2[c], paths[r][c]);
			}
		}
		rowmax = Math.max(rowmax, min);
		rowmin[r] = min;
	}

	for(c=0; c<len; c++) {
		if(col[c]!==-1)
			continue;

		colmax = Math.max(colmin2[c], colmax);
	}

	rcmax = Math.max(rowmax, colmax);

	for(var i=0; i<len; i++){
		if(row[i]===-1 && rowmin[i] === rcmax)
			for(c=0; c<len; c++){
				if(col[c]===-1 && paths[i][c]===0){
					offTree2(paths, false, i, c, row, col, lowLimit, iter);
					offTree2(paths, true, i, c, row, col, lowLimit, iter, rowmin[i], colmin2[c]);
					return;
				}
			}

		if(col[i]===-1 && colmin2[i] === rcmax)
			for(r=0; r<len; r++){
				if(row[r]===-1 && paths[r][i]===0){
					offTree2(paths, false, r, i, row, col, lowLimit, iter);
					offTree2(paths, true, r, i, row, col, lowLimit, iter, rowmin[r], colmin2[i]);
					return;
				}
			}
	}
}
/*
function test(){
	var max = Number.MAX_SAFE_INTEGER,
		data = [
			[max, 3, 93, 13, 33, 12],
			[4, max, 77, 42, 21, 16],
			[45, 17, max, 36, 16, 28],
			[39, 90, 80, max, 56, 7],
			[28, 46, 88, 33, max, 25],
			[3, 88, 18, 46, 92, max]
		];

	var row = [],
		col = [];

	for(var i=0; i<data.length; i++){
		row[i] = -1;
		col[i] = -1;
	}

	paths = deepCopy(data);
	find4(data, row, col, 0, [], 0, 0);
}

function test2(){
	var data = [
		[1,2],
		[2,3],
		[3,4],
		[4,5],
		[1,5],
		[4,8]
		],
		max = Number.MAX_SAFE_INTEGER;

	data.forEach(function(pointA, idxA){
		paths[idxA] = [];

		data.forEach(function(pointB, idxB){
			if(idxA===idxB)
				paths[idxA][idxB] = max;
			else
				paths[idxA][idxB] = Math.round(Math.sqrt(Math.pow(pointA[0]-pointB[0], 2) + Math.pow(pointA[1]-pointB[1], 2))*multi);
		});
	});

	var row = [],
		col = [];

	for(var i=0; i<data.length; i++){
		row[i] = -1;
		col[i] = -1;
	}

	//console.log(paths);
	find4(deepCopy(paths), row, col, 0, 0, 0);
}

*/
//console.time('1');
//test2();
//checkOffList();
//console.timeEnd('1');
//console.log(solutions);
//console.log('');

/*
solutions.forEach(function(sol){
	console.log(sol);
});*/

//console.log(hamiltonCycle([ [ 1, 0 ], [ 0, 3 ], [ 5, 1 ], [ 4, 2 ], [ 3, 4 ], [ 2, 5 ] ]));