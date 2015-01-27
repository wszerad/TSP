//global
	var paths,
		max = Number.MAX_SAFE_INTEGER,
		multipler = 1000;
//global

var App = angular.module('forms', []);

App.controller('dataController', ['$scope', function($scope) {
	$scope.points = [];

	$scope.showRes = 0;

	$scope.types = [
		{name: 'Instrukcja', s: 2},
		{name: 'Macierz odległości', s: 1},
		{name: 'Współrzędne karteziańskie', s: 0},
	];

	$scope.inps = {
		workers: 1,
		type: $scope.types[0]
	};

	$scope.select = function(index){
		document.querySelector('#data > ul > .active').className = null;
		document.querySelectorAll('#data > ul > li')[index].className = 'active';

		$scope.inps.type = $scope.types[index];
	};

	$scope.calculate = function(){
		paths = [];
		offList = {};
		solutions = [];
		solutionLow = Number.MAX_SAFE_INTEGER;

		var type = $scope.inps.type.s,
			data = $scope.points[type];

		try {
			switch (type) {
				case 0:
					conversions.fromPlaces(data);
					break;
				case 1:
					conversions.fromMatrix(data);
					break;
			}
		} catch (e){
			console.log(e);
			alert(e.message);
			return;
		}

		start(paths, function(time, count, ways, results){
			if(!results.length)
				return;

			$scope.results.time = time;
			$scope.results.count = count;
			$scope.results.ways = ways;
			$scope.results.way = results[0].limit/multipler;
			$scope.results.results = angular.copy(results);

			$scope.showRes = 1;
		});
	};

	$scope.results = {
		time: 0,
		count: 0,
		ways: 0,
		way: 0,
		results: []
	};
}]);

App.controller('manualPlaces', ['$scope', function($scope) {
	$scope.count = 0;
	$scope.clipboard = '';
	$scope.$parent.points[0] = $scope.points = [];

	$scope.add = function(){
		for(var i=0; i<$scope.count; i++)
			$scope.points.push([0, 0]);
	};

	$scope.delete = function(index){
		$scope.points.splice(index, 1);
	};

	$scope.reset = function(){
		$scope.points.splice(0, $scope.points.length);
	};

	$scope.readMem = function(){
		var data = conversions.fromFilePlaces($scope.clipboard);

		for(var i=0; i<data.length; i++)
			$scope.points[i] = data[i];

		$scope.clipboard = '';
	};

	$scope.upload = function(self){
		var input = self,
			reader = new FileReader();

		$scope.points.splice(0, $scope.points.length);

		reader.onload = function(){
			var data = conversions.fromFilePlaces(reader.result);
			for(var i=0; i<data.length; i++)
				$scope.points[i] = data[i];

			$scope.$digest();
		};
		reader.readAsText(input.files[0]);
	};
}]);

App.controller('manualMatrix', ['$scope', function($scope) {
	$scope.count = 0;
	$scope.clipboard = '';
	$scope.$parent.points[1] = $scope.points = [];

	$scope.add = function(){
		var row = [],
			len = $scope.points.length;

		while(len--){
			row.push(undefined);
		}

		for(var i=0; i<$scope.count; i++)
			$scope.points.push(row.slice());

		$scope.points.forEach(function(row){
			for(i=0; i<$scope.count; i++)
				row.push(undefined);
		});
	};

	$scope.delete = function(){
		for(var i=0; i<$scope.count; i++){
			$scope.points.pop();
			$scope.points.forEach(function(row){
				row.pop();
			});
		}
	};

	$scope.reset = function(){
		$scope.points.splice(0, $scope.points.length);
	};

	$scope.readMem = function(){
		var data = conversions.fromFileMatrix($scope.clipboard);

		console.log(data);

		for(var i=0; i<data.length; i++)
			$scope.points[i] = data[i];

		//$scope.$digest();
		$scope.clipboard = '';
	};

	$scope.upload = function(self){
		var input = self,
			reader = new FileReader();

		$scope.points.splice(0, $scope.points.length);

		reader.onload = function(){
			var data = conversions.fromFileMatrix(reader.result);
			for(var i=0; i<data.length; i++)
				$scope.points[i] = data[i];

			$scope.$digest();
		};
		reader.readAsText(input.files[0]);
	};
}]);

function factorial(n) {
	if ((n == 0) || (n == 1))
		return 1;
	else
		return (n * factorial(n-1));
}

function start(data, cb){
	var row = [],
		col = [],
		time = Date.now(),
		pCopy = deepCopy(paths);

	for(var i=0; i<paths.length; i++){
		row[i] = -1;
		col[i] = -1;
	}

	find4(pCopy, row, col, 0, 0, 0);
	checkOffList();

	if(!solutions.length) {
		alert('Nie znaleziono rozwiązania, sprawdź wprowadzone dane');
		return;
	}

	var sol = solutions.map(function(res){
		res.pairs = fromPairs(res.pairs).join(' -- ');
		return res;
	});

	cb(Date.now()-time, paths.length, factorial(pCopy.length-1), sol);
}

var conversions = {
	clearComma: function(data){
		return data.replace(',', '.');
	},
	fromFileMatrix: function(data){
		data = this.clearComma(data);

		data = data.split(/\n/).map(function(row){
			return row.split(/[^\w\.\,]+/);
		});

		if(data.length!=data[0].length){
			var nData = [],
				len = Math.sqrt(data[0].length);

			for(var i=0; i<len; i++){
				nData[i] = data[0].slice(i*len, i*len+len);
			}

			data = nData;
		}

		return data;
	},
	fromFilePlaces: function(data){
		data = this.clearComma(data);

		data = data.split('\n').map(function(row){
			return row.split(/[^\w\.\,]+/);
		});

		if(data[0].length>2){
			var nData = [],
				len = (data[0].length/2);

			for(var i=0; i<len; i++){
				nData[i] = data[0].slice(i*2, i*2+2);
			}

			data = nData;
		}

		return data;
	},
	fromPlaces: function(cords){
		paths = [];

		cords = cords.map(function(point){
			console.log(point);
			return point.map(function(cord){return String(cord).replace(',','.')*1});
		});

		cords.forEach(function(pointA, idxA){
			paths[idxA] = [];

			cords.forEach(function(pointB, idxB){
				if(isNaN(pointA[0]) || isNaN(pointA[1]) || isNaN(pointB[0]) || isNaN(pointB[1]))
					throw new Error('Distance is not a number');

				if(idxA===idxB)
					paths[idxA][idxB] = max;
				else
					paths[idxA][idxB] = Math.round(Math.sqrt(Math.pow(pointA[0]-pointB[0], 2) + Math.pow(pointA[1]-pointB[1], 2))*multipler);
			});
		});
	},
	fromMatrix: function(rows){
		var len = rows.length;

		paths = [];

		rows.forEach(function(cols, idxA){
			paths[idxA] = [];

			if(len!==cols.length)
				throw new Error('Number of column and rows must by the same!');

			cols.forEach(function(dist, idxB){
				if(idxA===idxB || isNaN(dist)){
					paths[idxA][idxB] = Number.MAX_SAFE_INTEGER;
					return;
				}

				paths[idxA][idxB] = String(dist).replace(',','.')*multipler;
			});
		});
	}
};