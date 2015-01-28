//javascript for operator view goes here
_.templateSettings = {
    interpolate: /\{\{\=(.+?)\}\}/g,
    evaluate: /\{\{(.+?)\}\}/g
};
var targeted = 1;
var current = 1;
var scrollSpd = 500;
var blackout = false;
var autoCommit = true;
var scrolling = false;

//line jquery object to hold dom
var $lines;

$(document).ready(function(){
	if($('#main-operator').length>0){
		//this function will universally commit the targeted line
		function commit(){
				//post the current sequence identifier through AJAX
				if($('.target-operator').attr('data-visibility')=="true"){
					$.ajax('/operator/pushTextSeq', {
						type:'POST',
						data: {
							seq:$('.target-operator').attr('data-sequence'),
	            operator: operator
						},
						success:(function(d){
							//display logic if successful
							$('.current-operator').removeClass('current-operator');
							$('.target-operator').addClass('current-operator');
							if(blackout){
								$('#blackout-icon-operator').addClass('blackout-off-operator');
								blackout=false;
							}
							current=$('.target-operator').attr('data-sequence');
						}),
						error:(function(){
							//put in better error handling here
							alert('Commit failed! Please check your connection.');
						}),
					});

				}

		}

		$('#main-operator').height($(window).innerHeight()+'px');
		//set the templates
		var tLine = _.template($('#line-template-operator').html());

		//make sure the lines are sorted by sequence instead of index when read in

		//!! refact this as well with custyom sort function
		/*lines = _.sortBy(lines,function(q){
			return q.sequence;
		});*/
		//this is a singleton so it's cool if it's anonymous
		lines.sort(function(a, b){
			if(a.sequence < b.sequence){
				return -1;
			}
			if(a.sequence > b.sequence){
				return 1;
			}
			return 0;
		}
);

		//templating per line
		/*_.each(lines, function(q, i){
			if(q.element.element_name.length>0){
				q.character = q.element.element_name + ':';
			}else{
				q.character=' ';
			}
			$('#line-holder-sub-operator').append(
				tLine(q)
			);
			$('.line-operator').first().addClass('target-operator');
			$('.line-operator').each(function(){
				if($(this).attr('data-visibility')=="false"){
					$(this).addClass('line-non-visible-operator');
				}
			});
		});*/
		//	refac with native for loop
		lines.forEach(function(q){
			if(q.element.element_name.length>0){
				q.character = q.element.element_name + ':';
			}else{
				q.character=' ';
			}
			document.getElementById('line-holder-sub-operator').innerHTML+=tLine(q);
			$('.line-operator').first().addClass('target-operator');
			$('.line-operator').each(function(){
				if($(this).attr('data-visibility')=="false"){
					$(this).addClass('line-non-visible-operator');
				}
			});
		});
		$lines = $('.line-operator');
		//this happens when you click the commit button
		$('#commit-button-operator').click(commit);

		//scrolling target feature
		//!!!this is the heaviest and needs refac big time
		//use named function for sorting
		//eventually shift all of this to the top to minimize hoisting
		//make this a singleton at the risk of being non-responsive

		var mid = $(window).innerHeight()/2.2;
		function sortHeight(a, b){
			//there's a problem i how offset works
			var an = Math.abs(a.offsetTop-mid);
			var bn = Math.abs(b.offsetTop-mid);
			if(an>bn){
				return 1;
			}
			if(an<bn){
				return -1;
			}
			return 0;
		}
		$('#line-holder-operator').scroll(function(){
			var updateInt = 100;
			//self destroying counter that catches up the highlighting
			if(!window.counting){
				window.counting = setTimeout(function(){
					//removed the targeted class
					$('.target-operator').removeClass('target-operator');
					//var mid = $(window).innerHeight()/2.2;
					//!! heaviest call shows in profiling
					/*var l = _.sortBy($('#line-holder-operator div.line-operator'), function(q){
						return Math.abs($(q).offset().top-mid);
					});*/
					$lines.sort(sortHeight);
					$lines.first().addClass('target-operator');
					targeted = parseInt($lines.first().attr('data-sequence'));
					//destroy the counter
					window.counting=false;
				}, updateInt);
			}

		});
		//click the line I want feature
		$('.line-operator').click(function(){
			var diff = ($('.target-operator').position().top - $(this).position().top)*1.0;
			$('#line-holder-operator').animate(
				{scrollTop:
					$('#line-holder-operator').scrollTop() - diff
				}, scrollSpd);
			});

		//action that rolls down preview and poplates is
		$('#preview-operator').click(function(){


			if($(this).attr('data-visible')=='false'){
				$(this).animate({left:'0px'}, 1000, function(){
					$(this).attr('data-visible', 'true');
					
					if($('#preview-operator iframe').attr('src')==""){
						$('#preview-operator iframe').attr('src', "/display/index?operator="+operator+"&view="+viewMode+"&work="+work);
					}
					
				});
			}else{
				$(this).animate({left:'-100%'}, 1000, function(){
					$(this).attr('data-visible', 'false');
				});
			}

		});
		//roll down the fast forward feature
		$('#fforward-operator').click(function(){
			if($(this).attr('data-visible')=='false'){
				$(this).animate({left:'0px'}, 1000, function(){
					$(this).attr('data-visible', 'true');
					$(this).find('input').first().focus();
				});
			}else{
				$(this).animate({left:'-100%'}, 1000, function(){
					$(this).attr('data-visible', 'false');
					$(this).find('input').first().blur();

				});
			}


		});

		//submit a line number
		$('#fforward-operator input').keypress(function(e){
			if(e.which == 13){
				//console.log($(this).val());
				var s = $(this).val();
				var l = _.find($('.line-operator'), function(q){
					return $(q).attr('data-sequence')==s;
				});
				//console.log(l);
				//this may be able to be abstracted to a single function

				if(l){
				var diff = ($('.target-operator').position().top - $(l).position().top)*1.0;
				$('#line-holder-operator').animate(
					{scrollTop:
						$('#line-holder-operator').scrollTop() - diff
					}, scrollSpd);
				}else{
					alert('Line ' + s + ' not found');
				}

				$('#fforward-operator').animate({left:'-100%'}, 1000, function(){
					$(this).attr('data-visible', 'false');
					var i = $(this).find('input').first();
					i.blur();
					i.val('');

				});

				return false;
			}
		});
		/*
		//need to debug this block
		$('#fforward-operator input').blur(function(){
				$('#fforward-operator').animate({left:'-100%'}, 500, function(){
					$(this).attr('data-visible', 'false');
					var i = $(this).find('input').first();
					i.blur();
					i.val('');

				});
			});
		*/

		//blackout the display
		$('#blackout-operator').click(function(){
			//console.log('blackout');
			if(!blackout){
				$.ajax('/operator/pushTextSeq', {
					type:'POST',
					data: {
						seq:0,
	          operator: operator
					},
					success:(function(d){
						console.log('display cleared');
						$('.current-operator').removeClass('current-operator');
						$('#blackout-icon-operator').toggleClass('blackout-off-operator');
						blackout=true;
					}),
				});
			}else{
				$.ajax('/operator/pushTextSeq', {
					type:'POST',
					data: {
						seq:current,
	          operator: operator
					},
					success:(function(d){
						console.log('display is back');
						var last = $.grep($('.line-operator'), function(n){
							return $(n).attr('data-sequence') == current;
						})[0];
						$(last).addClass('current-operator');
						//$('.current-operator').removeClass('current-operator');
						$('#blackout-icon-operator').toggleClass('blackout-off-operator');
						blackout=false;
					}),
				});
			}


		});
		$('#autocommit-operator').click(function(){
			if(autoCommit){
				autoCommit = false;
				console.log('autocommit off');

			}else{
				autoCommit = true;
				console.log('autocommit on');

			}
			console.log(this);
			$('#autocommit-icon-operator').toggleClass('autocommit-on-operator')
		});

		//single up and down buttons
		$('#up-button-operator').click(function(){
			if(!scrolling){
				scrolling=true;
				var prevNum = parseInt($('.target-operator').first().attr('data-sequence'))-1;
				var firstNum = parseInt($('.line-operator').first().attr('data-sequence'));
				var finalNum = parseInt($('.line-operator').last().attr('data-sequence'));
				console.log(prevNum);
				if(prevNum >= firstNum && prevNum < finalNum){
					var prevTar;
					while(typeof prevTar==='undefined' && prevNum >= firstNum){
						prevTar = $.grep($('.line-operator'), function(n){
							return $(n).attr('data-sequence') == prevNum;
						})[0];
						prevNum--;
						console.log(prevTar);
					}
					var diff = ($('.target-operator').position().top - $(prevTar).position().top)*1.0;
					$('#line-holder-operator').animate(
						{scrollTop:
							$('#line-holder-operator').scrollTop() - diff
						}, scrollSpd, function(){
							if(autoCommit){
								commit();
							}

							scrolling=false;
						});
				}
			}	
		});
		$('#down-button-operator').click(function(){
			if(!scrolling){
				scrolling=true;
				var nextNum = parseInt($('.target-operator').first().attr('data-sequence'))+1;
				var firstNum = parseInt($('.line-operator').first().attr('data-sequence'));
				var finalNum = parseInt($('.line-operator').last().attr('data-sequence'));
				if(nextNum <= finalNum && nextNum >= firstNum){
					var nextTar;
					while(typeof nextTar==='undefined' && nextNum < finalNum){
						nextTar = $.grep($('.line-operator'), function(n){
							return $(n).attr('data-sequence') == nextNum;
						})[0];
						nextNum++;
					}
					//console.log(nextTar);
					var diff = ($('.target-operator').position().top - $(nextTar).position().top)*1.0;
					$('#line-holder-operator').animate(
						{scrollTop:
							$('#line-holder-operator').scrollTop() - diff
						}, scrollSpd, function(){
							if(autoCommit){
								commit();
							}

							scrolling=false
						});
				}
			}
		});




	}

});
