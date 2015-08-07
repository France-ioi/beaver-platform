/* Copyright (c) 2012 Association France-ioi, MIT License http://opensource.org/licenses/MIT */
!function () {

var contestID;
var contestFolder;
var contestStatus;
var fullFeedback;
var nextQuestionAuto;
var teamID = 0;
var teamPassword = "";
var questionsData = [];
var questionsKeyToID = {};
var questionsToGrade = [];
var scores = {};
var bonusScore, ffTeamScore, ffMaxTeamScore; // fullFeedback versions
var teamScore = 0;
var maxTeamScore = 0;
var sending = false;
var answersToSend = {};
var answers = {};
var defaultAnswers = {};
var currentQuestionKey = "";
// SID is initialized to the empty string so that its encoding in an AJAX query
// is predictable (rather than being either '' or 'null').
var SID = '';
var hasAnsweredQuestion = false;
var hasDisplayedContestStats = false;
var delaySendingAttempts = 60000;
var nbSubmissions = 0;
var t = i18n.t;


/**
 * Old IE versions does not implement the Array.indexOf function
 * Setting it in Array.prototype.indexOf makes IE crash
 * So the graders are using this inArray function
 *
 * @param {array} arr
 * @param {type} value
 * @returns {int}
 */
function inArray(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == value) {
            return i;
        }
    }
    return -1;
}

/**
 * The platform object as defined in the Bebras API specifications
 *
 * @type type
 */
var platform = {
   updateHeight: function(height) {
      questionIframe.setHeight(height);
   },
   openUrl: function(url) {
      // not used here
   },
   showView: function(views) {
      // not used here
   },
   askHint: function(numHint) {
      // not used here
   },
   getTaskParams: function(key, defaultValue) {
      var questionData = questionsData[questionsKeyToID[questionIframe.questionKey]];
      var res = {'minScore': questionData.minScore, 'maxScore': questionData.maxScore, 'noScore': questionData.noAnswerScore, 'randomSeed': teamID, 'options': questionData.options};
      if (typeof key !== 'undefined') {
         if (key !== 'options' && key in res) {
            return res[key];
         } else if (res.options && key in res.options) {
            return res.options[key];
         }
         return (typeof defaultValue !== 'undefined') ? defaultValue : null;
      }
      return res;
   },
   validate: function(mode) {
      if (TimeManager.isContestOver()) {
         alert(t("contest_closed_answers_readonly"));
         return;
      }

      // Store the answer
      questionIframe.task.getAnswer(function(answer) {
         if (mode == "cancel") {
            answer = "";
         }
         var questionData = questionsData[questionsKeyToID[questionIframe.questionKey]];
         if (fullFeedback) {
            questionIframe.iframe.contentWindow.grader.gradeTask(answer, null, function(score, message) {
               if (score < questionData.maxScore) {
                  mode = "stay";
               }
               if ((answer != defaultAnswers[questionIframe.questionKey]) || (typeof answers[questionIframe.questionKey] != 'undefined')) {
                  var prevScore = 0;
                  if (typeof  scores[questionIframe.questionKey] != 'undefined') {
                     prevScore = scores[questionIframe.questionKey].score;
                  }
                  if ((typeof answers[questionIframe.questionKey] == 'undefined') ||
                      ((answer != answers[questionIframe.questionKey]) && (score >= prevScore))) {
                     scores[questionIframe.questionKey] = {score: score, maxScore: questionData.maxScore};
                     submitAnswer(questionIframe.questionKey, answer, score);
                     answers[questionIframe.questionKey] = answer;
                     $('#score_' + questionData.key).html(score + " / " + questionData.maxScore);
                  }
               }
               computeFullFeedbackScore();
               platform.continueValidate(mode);
            });
         } else {
            submitAnswer(questionIframe.questionKey, answer, null);
            answers[questionIframe.questionKey] = answer;
            platform.continueValidate(mode);
         }
      });
   },
   continueValidate: function(mode) {
      if (!nextQuestionAuto) {
         return;
      }
      var questionData = questionsData[questionsKeyToID[questionIframe.questionKey]];
      var nextQuestionID = questionData.nextQuestionID;
      if ((!hasAnsweredQuestion) && (nextQuestionID !== "0")) {
         if ((mode != "stay") && (mode != "cancel")) {
            if (fullFeedback) {
               // TODO : translate
               alert("Vous avez répondu à votre première question, et la suivante va s'afficher automatiquement. Dans la liste à gauche, vous pouvez voir si la question a été résolue (symbole vert) et le nombre de points obtenus, vous pouvez aussi revenir sur une question en cliquant sur son nom.");
            } else {
               alert(t("first_question_message"));
            }
         }
         hasAnsweredQuestion = true;
      }

      var delay = 2300;
      switch (mode) {
         case 'stay':
         case 'cancel':
            break;
         case 'next':
            delay = 400;
         case 'done':
         default:
            // Next question
            if (nextQuestionID !== "0") {
               setTimeout(function() {
                  selectQuestion(nextQuestionID, false);
               }, delay);
            }
            else {
               setTimeout(function() {
                  alert(t("last_question_message"));
               }, delay);
            }
            break;
      }
   }
};

/**
 * Task iframe
 */
var questionIframe = {
   iframe: null,
   doc: null,
   body: null,
   tbody: null,
   initialized: false,
   loaded: false,
   questionKey: null,
   task: null,
   gradersLoaded: false,

   /**
    * Load a javascript file inside the iframe
    *
    * @param string filename
    * @param {function} callback
    */
   addJsFile: function(filename, callback) {
      var script = this.doc.createElement('script');
      script.src = filename;
      if (script.addEventListener) {
         script.addEventListener('load', callback, false);
      }
      else if (script.readyState) {
         script.onreadystatechange = function () {
            if (script.readyState === 'complete' || script.readyState === 'loaded') {
               callback();
            }
         }
      }

      this.tbody.appendChild(script);
   },

   /**
    * Load a css file inside the iframe
    *
    * @param string filename
    */
   addCssFile: function(filename) {
      var css = this.doc.createElement('link');
      css.rel = 'stylesheet';
      css.type = 'text/css';
      css.href = filename;
      this.doc.getElementsByTagName('head')[0].appendChild(css);
   },

   /**
    * Add some css inside the iframe
    *
    * @param {string} content Css content
    */
   addCssContent: function(content) {
      var style = this.doc.createElement('style');
      style.type = 'text/css';
      var iframeWin = this.iframe.contentWindow;
      if (iframeWin.addEventListener) {
         style.appendChild(this.doc.createTextNode(content));
      } else { // IE
          // http://stackoverflow.com/questions/5618742/ie-8-and-7-bug-when-dynamically-adding-a-stylesheet
          style.styleSheet.cssText = content;
      }
      // We can put it in #jsContent as it makes no difference
      this.doc.getElementById('jsContent').appendChild(style);
   },

   /**
    * Add some javascript inside the iframe
    *
    * @param {string} content Javascript content
    */
   addJsContent: function(content) {
      var script = this.doc.createElement('script');
      var iframeWin = this.iframe.contentWindow;
      if (iframeWin.addEventListener) {
         script.appendChild(this.doc.createTextNode(content));
      } else {
         script.text = content;
      }
      this.doc.getElementById('jsContent').appendChild(script);
   },

   /**
    * Remove the JS added by the addJsContent method
    */
   removeJsContent: function() {
      this.body.find('#jsContent').empty();
   },

   /**
    * Inject Javascript code in iframe
    */
   inject: function(jsContent) {
      var iframeWin = this.iframe.contentWindow;
      if (!iframeWin.eval && iframeWin.execScript) {
         iframeWin.execScript("null");
      }
      if (iframeWin.eval) {
         iframeWin.eval(jsContent);
      } else {
         alert("No eval!");
      }
   },

   /**
    * Evaluate something in the iframe context
    *
    * @param {string} expr
    * @returns result
    */
   evaluate: function(expr) {
      return this.iframe.contentWindow.eval(expr);
   },

   /**
    * Initialize the question iframe, must be run before anything else.
    * Acts somewhat like a constructor
    *
    * @param {function} callback when everything is loaded
    */
   initialize: function(callback) {
      // The iframe is removed then recreated. It is the only way to add a Doctype in it
      $('#question-iframe').remove();

      var iframe = document.createElement('iframe');
      iframe.setAttribute('id', 'question-iframe');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('src', 'about:blank');

      var content = '<!DOCTYPE html>'
       + '<html><head><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>'
       + '<body></body></html>';
      var ctnr = document.getElementById('question-iframe-container');
      ctnr.appendChild(iframe);

      iframe.contentWindow.document.open('text/html', 'replace');
      iframe.contentWindow.document.write(content);
      if (typeof iframe.contentWindow.document.close === 'function')
         iframe.contentWindow.document.close();

      this.iframe = $('#question-iframe')[0];
      this.doc = $('#question-iframe')[0].contentWindow.document;
      this.body = $('body', this.doc);
      this.tbody = this.doc.getElementsByTagName('body')[0];

      this.setHeight(0);
      this.body.css('width', '822px');
      this.body.css('margin', '0');
      this.body.css('padding', '0');

      // users shouldn't reload iframes
      this.inject('window.onbeforeunload = function() {return "Désolé, il est impossible de recharger l\'iframe. Si un problème est survenu, sélectionnez une autre question et revenez sur celle-ci.";};');

      // Inject localized strings
      this.inject('var t = function(item) {return item;}; function setTranslate(translateFun) { t = translateFun; }');
      this.iframe.contentWindow.setTranslate(t);

      // Inject ImagesLoader
      this.inject('var ImagesLoader = { \n\
    newUrlImages: {}, \n\
    loadingImages: new Array(), \n\
    imagesToPreload: null, \n\
    contestFolder: null, \n\
    nbImagesToLoad: 0, \n\
    nbImagesLoaded: 0, \n\
    nbPreloadErrors: 0, \n\
    switchToNonStatic: false, \n\
    preloadCallback: null, \n\
    preloadAllImages: null, \n\
    /* Defines what function to call once the preload phase is over */ setCallback: function (callback) { \n\
        this.preloadCallback = callback; \n\
    }, \n\
    /* Called by the generated contest .js file with the list of images to preload */ setImagesToPreload: function (imagesToPreload) { \n\
        this.imagesToPreload = imagesToPreload; \n\
    }, \n\
    addImagesToPreload: function (imagesToPreload) { \n\
        this.imagesToPreload = this.imagesToPreload.concat(imagesToPreload); \n\
    }, \n\
    errorHandler: function () { \n\
        var that = ImagesLoader;\n\
        that.loadingImages[that.nbImagesLoaded].onload = null; \n\
        that.loadingImages[that.nbImagesLoaded].onerror = null; \n\
        that.nbPreloadErrors++;  \n\
        if (that.nbPreloadErrors == 4){ \n\
            alert(t("error_connexion_server")); \n\
        } \n\
        if (that.nbPreloadErrors == 20) { \n\
            alert(t("error_connexion_server_bis")); \n\
            that.nbImagesLoaded = that.nbImagesToLoad; \n\
        } \n\
        setTimeout(that.loadNextImage, 2000); \n\
    }, \n\
    /* * Called after each successful load of an image. Update the interface and starts * loading the next image. */ loadHandler: function () { \n\
        var that = ImagesLoader; \n\
        that.loadingImages[that.nbImagesLoaded].onload = null; \n\
        that.loadingImages[that.nbImagesLoaded].onerror = null; \n\
        that.nbImagesLoaded++; \n\
        that.nbPreloadErrors = 0;  \n\
        parent.setNbImagesLoaded("" + that.nbImagesLoaded + "/" + that.nbImagesToLoad); \n\
        setTimeout(function() { that.loadNextImage(); }, 1); \n\
    }, \n\
    loadNextImage: function () { \n\
        var that = ImagesLoader; \n\
        if (that.nbImagesLoaded === that.nbImagesToLoad) { \n\
            that.preloadCallback(); \n\
            return; \n\
        } \n\
        if (that.loadingImages[that.nbImagesLoaded] == undefined) { \n\
            that.loadingImages[that.nbImagesLoaded] = new Image(); \n\
            that.loadingImages[that.nbImagesLoaded].onerror = that.errorHandler; \n\
            that.loadingImages[that.nbImagesLoaded].onload = that.loadHandler; \n\
            var srcImage = that.imagesToPreload[that.nbImagesLoaded]; \n\
            if (srcImage == "") { \n\
                that.loadHandler(); \n\
                return; \n\
            } \n\
            if (that.nbPreloadErrors > 0) { \n\
                var oldSrcImage = srcImage; \n\
                srcImage += "?v=" + that.nbPreloadErrors + "_" + Parameters.teamID; \n\
                that.newUrlImages[oldSrcImage] = srcImage; \n\
                if (that.nbPreloadErrors > 2) { \n\
                    that.switchToNonStatic = true; \n\
                } \n\
            } \n\
            if (that.switchToNonStatic) { \n\
                srcImage = srcImage.replace("static1.france-ioi.org", "concours1.castor-informatique.fr"); \n\
                srcImage = srcImage.replace("static2.france-ioi.org", "concours2.castor-informatique.fr"); \n\
                that.newUrlImages[that.imagesToPreload[that.nbImagesLoaded]] = srcImage; \n\
            } \n\
            that.loadingImages[that.nbImagesLoaded].src = srcImage; \n\
        } else { \n\
            ImagesLoader.loadHandler(); \n\
        } \n\
    }, \n\
    preload: function (contestFolder) { \n\
        ImagesLoader.contestFolder = contestFolder; \n\
        ImagesLoader.nbImagesToLoad = ImagesLoader.imagesToPreload.length; \n\
        ImagesLoader.loadNextImage(); \n\
    }, \n\
    /* Updates the src attribute of images that couldnt be pre-loaded with the original url. */ refreshImages: function () { \n\
        $.each($("img"), function (i, elem) { \n\
            var posContest = this.src.indexOf("contest"); \n\
            if (posContest < 0) { \n\
                return; \n\
            } \n\
            if (ImagesLoader.newUrlImages[this.src] != undefined) { \n\
                this.src = ImagesLoader.newUrlImages[this.src]; \n\
            } \n\
        }); \n\
    } \n\
};');

      // No more global css file
      //this.addCssFile(contestsRoot + '/' + contestFolder + '/contest_' + contestID + '.css');

      // Call image preloading
      this.addJsFile(contestsRoot + '/' + contestFolder + '/contest_' + contestID + '.js', callback);

      this.body.append('<div id="jsContent"></div><div id="container" style="border: 1px solid #000000; padding: 10px 20px 10px 20px;"><div class="question" style="font-size: 20px; font-weight: bold;">Le contenu du concours est en train d\'être téléchargé, merci de patienter le temps nécessaire.</div></div>');

      this.initialized = true;
   },

   /**
    * Run the task, should be called only by the loadQuestion function
    */
   run: function(taskViews, callback) {
      TaskProxyManager.getTaskProxy('question-iframe', withTask, true);
      function withTask (task) {
        questionIframe.task = task;
        TaskProxyManager.setPlatform(task, platform);
        task.load(taskViews, function() {
           task.showViews(taskViews, function() {
              if (typeof defaultAnswers[questionIframe.questionKey] == 'undefined') {
                 task.getAnswer(function(strAnswer) {
                    defaultAnswers[questionIframe.questionKey] = strAnswer;
                 });
              }
              task.getHeight(function(height) {
                 platform.updateHeight(height);
              });
           });
        });
        // Iframe height "hack" TODO: why two timers?
        setTimeout(function() {
           task.getHeight(function(height) {
              platform.updateHeight(height);
           });
        }, 500);
        setTimeout(function() {
           task.getHeight(function(height) {
              platform.updateHeight(height);
           });
        }, 1000);

        // TODO : test without timeout : should not be needed.
        setTimeout(function() {
           var nextStep = function() {
              setTimeout(function() {
                 if (!hasDisplayedContestStats) {
                    if (fullFeedback) {
                       alert("C'est parti ! Notez votre score en haut à gauche qui se met à jour au fur et à mesure de vos réponses !");
                    } else {
                       alert(t("contest_starts_now"));
                    }
                    hasDisplayedContestStats = true;
                 }
              }, 200);

              if (callback != undefined) {
                 callback();
              }
           }

           // Load the session's answer, if any
           if (answers[questionIframe.questionKey]) {
              var answer = answers[questionIframe.questionKey];
              task.reloadAnswer(answer, function() {
                 nextStep();
              });
           } else {
              nextStep();
           }
        }, 50);
      }
   },

   /**
    * Load the question, should be call only by the load function
    *
    * @param string questionKey
    */
   loadQuestion: function(taskViews, questionKey, callback) {
      this.body.find('#container > .question').remove();
      // We cannot just clone the element, because it'll result in an strange id conflict, even if we put the result in an iframe
      var questionContent = $('#question-' + questionKey).html();
      if (!questionContent) {
         questionContent = 'Il s\'est produit une anomalie lors du téléchargement du contenu du concours. Veuillez tenter de recharger la page avec Ctrl+R ou Ctrl+F5. Si cela ne fonctionne pas, essayez éventuellement avec un autre navigateur. En cas d\'échec répété, merci de contacter la hotline, pour que nous puissions rechercher la cause de ce problème.';
      }
      this.body.find('#container').append('<div id="question-'+questionKey+'" class="question">'+questionContent+'</div>');

      // Remove task-specific previous added JS, then add the new one
      this.removeJsContent();

      // Load js modules
      var that = this;
      $('.js-module-'+questionKey).each(function() {
         var jsModuleId = 'js-module-'+$(this).attr('data-content');
         that.addJsContent($('#'+jsModuleId).attr('data-content'));
      });

      // Load specific js
      this.addJsContent($('#javascript-' + questionKey).attr('data-content'));
      if ('solution' in taskViews) {
         this.addJsContent($('#javascript-solution-' + questionKey).attr('data-content'));
      }
      if ('grader' in taskViews) {
         this.addJsContent($('#javascript-grader-' + questionKey).attr('data-content'));
      }

      // Load css modules
      var that = this;
      $('.css-module-'+questionKey).each(function() {
         var cssModuleId = 'css-module-'+$(this).attr('data-content');
         that.addCssContent($('#'+cssModuleId).attr('data-content'));
      });

      setTimeout(function() {
         questionIframe.run(taskViews, callback);
         loadSolutionChoices(questionKey);
      }, 100);

      this.loaded = true;
      this.questionKey = questionKey;
   },

   /**
    * Load the question when ready
    *
    * @param {string} questionKey
    */
   load: function(taskViews, questionKey, callback) {
      if (this.loaded) {
         var that = this;
         if (questionIframe.task && questionIframe.task.iframe_loaded) {
            questionIframe.task.unload(function() {
               that.loaded = false;
               that.loadQuestion(taskViews, questionKey, callback);
            })
         }
         else {
            this.loaded = false;
            this.loadQuestion(taskViews, questionKey, callback);
         }
      }
      else {
         this.loadQuestion(taskViews, questionKey, callback);
      }
   },

   setHeight: function(height) {
       height = Math.max($(window).height() - 79, height + 25);
       $('#question-iframe').css('height', height + 'px');
   }
};

var Utils = {
   disableButton: function(buttonId) {
      var button = $("#" + buttonId);
      if (button.attr("disabled")) {
         return false;
      }
      button.attr("disabled", true);
      return true;
   },

   enableButton: function(buttonId) {
      var button = $("#" + buttonId);
      button.attr("disabled", false);
   },

   pad2: function(number) {
      if (number < 10) {
         return "0" + number;
      }
      return number;
   },

   /*
    * Returns an array with numbers 0 to nbValues -1.
    * Unless preventShuffle is true, the order is "random", but
    * is fully determined by the value of the integer ordeKey
   */
   getShuffledOrder: function (nbValues, orderKey, preventShuffle) {
      var order = [];
      for (var iValue = 0; iValue < nbValues; iValue++) {
         order.push(iValue);
      }
      if (preventShuffle) {
         return order;
      }
      for (var iValue = 0; iValue < nbValues; iValue++) {
         var pos = iValue + (orderKey % (nbValues - iValue));
         var tmp = order[iValue];
         order[iValue] = order[pos];
         order[pos] = tmp;
      }
      return order;
   }
};

/*
 * TimeManager is in charge of checking and displaying how much time contestants
 * still have to answer questions.
 * all times are in seconds since 01/01/70
*/
var TimeManager = {
   endTime: null,  // is set once the contest is closed, to the closing time
   timeUsedBefore: null, // time used before the contest is loaded (in case of an interruption)
   timeStart: null, // when the contest was loaded (potentially after an interruption)
   totalTime: null, // time allocated to this contest
   endTimeCallback: null, // function to call when out of time
   interval: null,
   prevTime: null,
   synchronizing: false,

   setTotalTime: function(totalTime) {
      this.totalTime = totalTime;
   },

   init: function(timeUsed, endTime, contestOverCallback, endTimeCallback) {
      this.timeUsedBefore = parseInt(timeUsed);
      this.endTime = endTime;
      this.endTimeCallback = endTimeCallback;
      var curDate = new Date();
      this.timeStart = curDate.getTime() / 1000;
      if (this.endTime != null) {
         contestOverCallback();
      } else if (this.totalTime > 0) {
         this.prevTime = this.timeStart;
         this.updateTime();
         this.interval = setInterval(this.updateTime, 1000);
      } else {
         $("#chrono").hide();
      }
   },

   getRemainingTime: function() {
      var curDate = new Date();
      var curTime = curDate.getTime() / 1000;
      var usedTime = (curTime - this.timeStart) + this.timeUsedBefore;
      var remainingTime = this.totalTime - usedTime;
      if (remainingTime < 0) {
         remainingTime = 0;
      }
      return remainingTime;
   },

   // fallback when sync with server fails:
   simpleTimeAdjustment: function() {
      var curDate = new Date();
      var timeDiff = curDate.getTime() / 1000 - TimeManager.prevTime;
      TimeManager.timeStart += timeDiff - 1;
      setTimeout(function() {
         TimeManager.syncWithServer(message);
      }, 120000);
   },

   syncWithServer: function() {
      TimeManager.synchronizing = true;
      $("#minutes").html('');
      $("#seconds").html('synchro...');
      var remainingTime = this.getRemainingTime();
      $.post('data.php', {SID: SID, action: 'getRemainingTime', teamID: teamID},
         function(data) {
            if (data.success) {
               TimeManager.timeStart = TimeManager.timeStart + remainingTime - data.remainingTime;
            } else {
               TimeManager.simpleTimeAdjustment();
            }
         }
      , 'json').done(function() {
         var curDate = new Date();
         TimeManager.prevTime = curDate.getTime() / 1000;
         TimeManager.synchronizing = false;
      }).fail(function() {
         TimeManager.simpleTimeAdjustment();
         TimeManager.synchronizing = false;
      });
   },

   updateTime: function() {
      if (TimeManager.endTime != null || TimeManager.synchronizing) {
         return;
      }
      var curDate = new Date();
      var curTime = curDate.getTime() / 1000;
      var timeDiff = curTime - TimeManager.prevTime;
      // We traveled through time, more than 60s difference compared to 1 second ago !
      if (Math.abs(timeDiff) > 60) {
         TimeManager.syncWithServer();
         return;
      }
      TimeManager.prevTime = curTime;
      var remainingTime = TimeManager.getRemainingTime();
      var minutes = Math.floor(remainingTime / 60);
      var seconds = Math.floor(remainingTime - 60 * minutes);
      $("#minutes").html(minutes);
      $("#seconds").html(Utils.pad2(seconds));
      if (remainingTime <= 0) {
         clearInterval(this.interval);
         TimeManager.endTimeCallback();
      }
   },

   setEndTime: function(endTime) {
      this.endTime = endTime;
   },

   stopNow: function() {
      var curDate = new Date();
      this.endTime = curDate.getTime() / 1000;
   },

   isContestOver: function() {
      return this.endTime != null;
   }
};

// Main page

window.selectMainTab = function(tabName) {
   var tabNames = ["school", "home", "continue"];
   for(var iTab = 0; iTab < tabNames.length; iTab++) {
      if (tabNames[iTab] === tabName) {
         $("#tab-" + tabNames[iTab]).show();
         $("#button-" + tabNames[iTab]).addClass("selected");
      } else {
         $("#tab-" + tabNames[iTab]).hide();
         $("#button-" + tabNames[iTab]).removeClass("selected");
      }
   }
}

window.confirmPublicGroup = function() {
   $("#warningPublicGroups").hide();
   $("#publicGroups").show();
}
// Contest startup

/*
 * Generates the html that displays the list of questions on the left side of the page
*/
function fillListQuestions(sortedQuestionIDs, questionsData)
{
   var strListQuestions = "";
   for (var iQuestionID = 0; iQuestionID < sortedQuestionIDs.length; iQuestionID++) {
      questionID = sortedQuestionIDs[iQuestionID];
      var questionData = questionsData[questionID];
      var encodedName = questionData.name.replace("'", "&rsquo;");

      var strScore = "";
      if (fullFeedback) {
         if (scores[questionData.key] !== undefined) {
            strScore = scores[questionData.key].score + " / " + questionData.maxScore;
         } else {
            strScore = questionData.noAnswerScore + " / " + questionData.maxScore;
         }
      }
      strListQuestions += "<tr><td class='questionBullet' id='bullet_" + questionData.key + "'></td><td class='questionLink' id='link_" + questionData.key + "' " +
         "onclick='selectQuestion(" + questionData.ID + ", true)'>" +
         encodedName + "</td><td class='questionScore' id='score_" + questionData.key + "'>" + strScore + "</td></tr>";
   }
   $("#questionList").html("<table>" + strListQuestions + "</table>");
   if (fullFeedback) {
      $(".questionListHeader").css("width", "240px");
      $(".question, #divQuestionParams, #divClosed, .questionsTable, #question-iframe-container").css("left", "245px");
   }
}

/*
 * Setup of the contest when the group has been selected, contestants identified,
 * the team's password given to the students, and the images preloaded
*/
function setupContest(data) {
   teamPassword = data["teamPassword"];
   questionsData = data["questionsData"];

   // Reloads previous scores to every question
   scores = {};
   for (var questionID in data.scores) {
      if (questionID in questionsData) {
         var questionKey = questionsData[questionID].key;
         scores[questionKey] = {score: data.scores[questionID], maxScore: questionsData[questionID].maxScore};
      }
   }
   if (fullFeedback) {
      computeFullFeedbackScore();
      $("#scoreTotalFullFeedback").html(ffTeamScore + ' / ' + ffMaxTeamScore);
   }

   // Determines the order of the questions, and displays them on the left
   var sortedQuestionIDs = getSortedQuestionIDs(questionsData);
   fillListQuestions(sortedQuestionIDs, questionsData);

   // Defines function to call if students try to close their browser or tab
   window.onbeforeunload = function() {
      return t("warning_confirm_close_contest");
   }

   // Map question key to question id array
   for (var questionID in questionsData) {
      questionsKeyToID[questionsData[questionID].key] = questionID;
   }

   // Displays the first question
   var questionData = questionsData[sortedQuestionIDs[0]];
   // We don't want to start the process of selecting a question, if the grading is going to start !
   var noLoad = (data.endTime != null);

   selectQuestion(sortedQuestionIDs[0], false, noLoad);

   // Reloads previous answers to every question
   answers = {};
   for (var questionID in data.answers) {
      if (questionID in questionsData) {
         var questionKey = questionsData[questionID].key;
         answers[questionKey] = data.answers[questionID];
         markAnswered(questionKey, answers[questionKey]);
         hasAnsweredQuestion = true;
      }
   }
   $('#buttonClose').show();
   // Starts the timer
   TimeManager.init(
      data.timeUsed,
      data.endTime,
      function() {
         closeContest(t("contest_is_over"));
      },
      function() {
         closeContest("<b>" + t("time_is_up") + "</b>");
      }
   );

   //questionIframe.iframe.contentWindow.ImagesLoader.refreshImages();
}

/*
 * Loads contest's css and js files,
 * then preloads all contest images
 * then gets questions data from the server if groupPassword and teamID are valid,
 * then loads contest html file
 * then calls setupContest
 * if temID/password are incorrect, this means we're in the middle of re-login after an interruption
 * and the password provided is incorrect
*/
function loadContestData(contestID, contestFolder, groupPassword, teamID)
{
   $("#divImagesLoading").show();
   questionIframe.initialize(function() {
      if (fullFeedback) {
         $.post("graders.php", {SID: SID}, function(data) {
            if (data.status === 'success' && (data.graders || data.gradersUrl)) {
               questionIframe.gradersLoaded = true;
               if (data.graders) {
                  $('#divGradersContent').html(data.graders);
               } else {
                  $('#divGradersContent').load(data.gradersUrl);
               }
            }
            if (data.status == 'success') { bonusScore = parseInt(data.bonusScore); }
         }, 'json');
      }
      // The callback will be used by the task
      questionIframe.iframe.contentWindow.ImagesLoader.setCallback(function() {
         $("#divHeader").hide();
         $("#divQuestions").show();
         if (fullFeedback) {
            $('#chrono').css('font-size', '1.3em');
            $('.fullFeedback').show();
         }
         showQuestionIframe();
         $("#divImagesLoading").hide();

         $.post("data.php", {SID: SID, action: "loadContestData", groupPassword: groupPassword, teamID: teamID},
         function(data) {
            if (!data.success) {
               $("#ReloginResult").html(t("invalid_password"));
               Utils.enableButton("buttonRelogin");
               return;
            }
            $("#divCheckGroup").hide();

            function oldLoader() {
               $.get(contestsRoot + '/' + contestFolder + "/contest_" + contestID + ".html", function(content) {
                  $('#divQuestionsContent').html(content);
                  setupContest(data);
               });
            }

            function newLoader() {
               var log_fn = function(text) {
                  $('#questionList').html("<span style='font-size:2em;padding-left:10px'>" + text + "</span>");
               };
               var loader = new Loader(contestsRoot + '/' + contestFolder + '/', log_fn);
               loader.run().done(function(content) {
                  $('#divQuestionsContent').html(content);
                  setupContest(data);
               }).fail(function() {
                  oldLoader();
               });
            }

            // XXX: select loader here
            newLoader();

         }, "json");
      });

      questionIframe.iframe.contentWindow.ImagesLoader.preload(contestFolder);
   });
}

/**
 * Update the number of preloaded images
 * Called by the task
 *
 * @param {string} content
 */
window.setNbImagesLoaded = function(content) {
   $("#nbImagesLoaded").html(content);
}

// Team connexion

/*
 * Called when starting a contest by providing a group code on the main page.
*/
window.checkGroup = function() {
   var groupCode = $("#groupCode").val();
   return checkGroupFromCode("CheckGroup", groupCode, false, false);
}

window.recoverGroup = function() {
   var curStep = 'CheckGroup';
   var groupCode = $("#groupCode").val();
   var groupPass = $('#recoverGroupPass').val();
   if (!groupCode || !groupPass) {return false;}
   $('#recoverGroupResult').html('');
   Utils.disableButton("buttonRecoverGroup");
   $.post("data.php", {SID: SID, action: "recoverGroup", groupCode: groupCode, groupPass: groupPass},
      function(data) {
         if (!data.success) {
            if (data.message) {
               $('#recoverGroupResult').html(data.message);
            } else {
               $('#recoverGroupResult').html(t("invalid_code"));
            }
            return;
         }
         checkGroup();
      }
   , 'json').done(function() { Utils.enableButton("buttonRecoverGroup") });
}

/*
 * Called when trying to continue a contest after an interruption
 * The password can either be a group password (leading to another page)
 * or directly a team password (to re-login directly)
*/
window.checkPasswordInterrupted = function() {
   var password = $("#interruptedPassword").val();
   return checkGroupFromCode("Interrupted", password, true, false)
}

/*
 * Fills a select field with all the names of the teams (of a given group)
 * Used to continue a contest if the students didn't write down the team password
*/
function fillListTeams(teams) {
   for (var curTeamID in teams) {
      var team = teams[curTeamID];
      var teamName = "";
      for (var iContestant in team.contestants) {
         var contestant = team.contestants[iContestant];
         if (iContestant == 1) {
            teamName += " et ";
         }
         teamName += contestant.firstName + " " + contestant.lastName;
      }
      $("#selectTeam").append("<option value='" + curTeamID + "'>" + teamName + "</option>");
   }
}

/*
 * Checks if a group is valid and loads information about the group and corresponding contest,
 * curStep: indicates which step of the login process the students are currently at :
 *   - "CheckGroup" if loading directly from the main page (public contest or group code)
 *   - "Interrupted" if loading from the interface used when continuing an interupted contest
 * groupCode: a group code, or a team password
 * isPublic: is this a public group ?
*/
window.checkGroupFromCode = function(curStep, groupCode, getTeams, isPublic) {
   Utils.disableButton("button" + curStep);
   $('#recoverGroup').hide();
   $("#" + curStep + "Result").html('');
   $.post("data.php", {SID: SID, action: "checkPassword", password: groupCode, getTeams: getTeams},
      function(data) {
         if (!data.success) {
            if (data.message) {
               $("#" + curStep + "Result").html(data.message);
            } else {
               $("#" + curStep + "Result").html(t("invalid_code"));
            }
            return;
         }
         contestID = data.contestID;
         contestFolder = data.contestFolder;
         fullFeedback = parseInt(data.fullFeedback);
         nextQuestionAuto = parseInt(data.nextQuestionAuto);
         contestStatus = data.contestStatus;
         TimeManager.setTotalTime(data.nbMinutes * 60);
         $("#headerH2").html(data.name);
         if (data.teamID !== undefined) { // The password of the team was provided directly
            $("#div" + curStep).hide();
            teamID = data.teamID;
            teamPassword = groupCode;
            loadContestData(contestID, contestFolder);
         } else {
            if ((data.nbMinutesElapsed > 30) && (data.isPublic === "0") && (!getTeams)) {
               if (parseInt(data.bRecovered)) {
                  alert(t("group_session_expired"));
                  window.location = t("contest_url");
                  return false;
               } else {
                  $("#recoverGroup").show();
                  return false;
               }
            }
            $("#div" + curStep).hide();
            if (curStep === "CheckGroup") {
               if (isPublic) {
                  nbContestants = 1;
                  createTeam([{ lastName: "Anonymous", firstName: "Anonymous", genre: 2}]);
               } else if (data.allowTeamsOfTwo == 1) {
                  $("#divCheckNbContestants").show();
               } else {
                  setNbContestants(1);
               }
            } else {
               fillListTeams(data.teams);
               $("#divRelogin").show();
            }
         }
      }, "json").done(function() { Utils.enableButton("button" + curStep) });
}

/*
 * Validates student's information form
 * then creates team
*/
window.validateLoginForm = function() {
   var contestants = {};
   for (var iContestant = 1; iContestant <= nbContestants; iContestant++) {
      var contestant = {
         "lastName" : $("#lastName" + iContestant).val(),
         "firstName" : $("#firstName" + iContestant).val(),
         "genre" : $("input[name='genre" + iContestant + "']:checked").val(),
         "grade" : $("#grade" + iContestant).val()
      };
      contestants[iContestant] = contestant;
      if ($.trim(contestant.lastName) === "") {
         $("#LoginResult").html(t("lastname_missing"));
         return;
      } else if ($.trim(contestant.firstName) === "") {
         $("#LoginResult").html(t("firstname_missing"));
         return;
      } else if ($.trim(contestant.genre) === "") {
         $("#LoginResult").html(t("genre_missing"));
         return;
      } else if (contestant.grade === "") {
         $("#LoginResult").html(t("grade_missing"));
         return;
      }
   }
   Utils.disableButton("buttonLogin"); // do not re-enable
   createTeam(contestants);
}

/*
 * Creates a new team using contestants information
*/
function createTeam(contestants) {
   $.post("data.php", {SID: SID, action: "createTeam", contestants: contestants},
      function(data) {
         teamID = data.teamID;
         teamPassword = data.password;
         $("#divLogin").hide();
         $("#teamPassword").html(data.password);
         $("#divPassword").show();
      }, "json");
}

/*
 * Called when students acknowledge their new team password
 * hides password and loads contest
*/
window.confirmTeamPassword = function() {
   if (!Utils.disableButton("buttonConfirmTeamPassword")) { // Do not re-enable
      return;
   }
   $("#divPassword").hide();
   loadContestData(contestID, contestFolder);
}

/*
 * Called when students select their team in the list of teams of their group,
 * and the teacher enters the group password (to continue after an interruption)
 * Tries to load the corresponding contest.
*/
window.relogin = function() {
   teamID = parseInt($("#selectTeam").val());
   var groupPassword = $("#groupPassword").val();
   if (teamID === 0) {
      $("#ReloginResult").html(t("select_team"));
      return;
   }
   Utils.disableButton("buttonRelogin");
   loadContestData(contestID, contestFolder, groupPassword, teamID);
}

/*
 * Called when students validate the form that asks them if they participate
 * alone or in a team of two students.
*/
window.setNbContestants = function(nb) {
   nbContestants = nb;
   if (nbContestants === 2) {
      $("#contestant2").show();
   }
   $("#divLogin").show();
   $("#divCheckNbContestants").hide();
}

/*
 * Generates the html for the list of public groups
*/
function getPublicGroupsList(groups) {
   var arrGroups = {};
   var years = {};
   var maxYear = 0;
   for (var iGroup = 0 ; iGroup < groups.length ; iGroup ++) {
      var group = groups[iGroup];
      if (arrGroups[group.level] == undefined) {
         arrGroups[group.level] = {};
      }
      var year = group.year % 10000;
      arrGroups[group.level][year] = group;
      years[year] = true;
      maxYear = Math.max(maxYear, year);
   }
   var levels = [
      {name: t("level_1_name"), id: 1},
      {name: t("level_2_name"), id: 2},
      {name: t("level_3_name"), id: 3},
      {name: t("level_4_name"), id: 4},
      {name: t("level_all_name"), id: 0}
   ];
   var strGroups = "<table style='border:solid 1px black' cellspacing=0 cellpadding=5>";
   for (var year = maxYear; years[year] == true; year--) {
      strGroups += "<tr class='groupRow'><td style='width:100px;border:solid 1px black'><b>Castor " + year + "</b></td>";
      for (var iLevel = 0; iLevel < levels.length; iLevel++) {
         var level = levels[iLevel];
         var group = undefined;
         if (arrGroups[level.id] != undefined) {
            group = arrGroups[level.id][year];
         }
         if (group != undefined) {
            strGroups += "<td style='width:100px;border:solid 1px black;text-align:center'>" +
               "<a href='#' onclick='checkGroupFromCode(\"CheckGroup\", \"" + group.code + "\", false, true)'> " + level.name + "</a></td>";
         } else {
            strGroups += "<td width=20%></td>";
         }
      }
      strGroups += "</tr>";
   }
   strGroups += "</table>";
   return strGroups;
}

/*
 * Loads all the information about a session if a session is already opened
 * Otherwise, displays the list of public groups.
*/
function loadSessionOrPublicGroups(restartSession) {
   var action = "loadSessionOrPublicGroups";
   if (restartSession) {
      action = "loadPublicGroups";
   }
   $.post("data.php", {SID: SID, action: action},
      function(data) {
         SID = data.SID;
         if (data.teamID != undefined) {
            if (!confirm("Voulez-vous reprendre l'épreuve commencée ?")) {
               loadSessionOrPublicGroups(true);
               return;
            }
            teamID = data.teamID;
            contestID = data.contestID;
            contestFolder = data.contestFolder;
            fullFeedback = parseInt(data.fullFeedback);
            nextQuestionAuto = parseInt(data.nextQuestionAuto);
            contestStatus = data.contestStatus;
            TimeManager.setTotalTime(data.nbMinutes * 60);
            $("#divCheckGroup").hide();
            loadContestData(contestID, contestFolder);
            return;
         }
         //$("#classroomGroups").show();
         if (data.groups.length === 0) {
            //$("#publicGroups").hide();
            return;
         }
         $("#listPublicGroups").html(getPublicGroupsList(data.groups));
         $("#contentPublicGroups").show();
         $("#loadPublicGroups").hide();
      }, "json");
}

// Obtain an association array describing the parameters passed to page
function getPageParameters() {
   var str = window.location.search.substr(1);
   var params = {};
   if (str != null && str != "") {
      var items = str.split("&");
      for (var idItem = 0; idItem < items.length; idItem++) {
         var tmp = items[idItem].split("=");
         params[tmp[0]] = decodeURIComponent(tmp[1]);
      }
   }
   return params;
}

/*
 * Initialisation
 * Cleans up identification form (to avoid auto-fill for some browser)
 * Inits ajax error handler
 * Loads current session or list of public groups
*/
function init() {
   for (var contestant = 1; contestant <= 2; contestant++) {
      $("#firstName" + contestant).val("");
      $("#lastName" + contestant).val("");
      $("#genre" + contestant + "_female").attr('checked', null);
      $("#genre" + contestant + "_male").attr('checked', null);
   }
   initErrorHandler();
   loadSessionOrPublicGroups(false);
   // Load initial tab according to parameters
   var params = getPageParameters();
   if (params.tab != undefined)
      selectMainTab(params.tab);
}

/*
 * Called when a student clicks on the button to stop before the timer ends
*/
window.tryCloseContest = function() {
   var remainingTime = TimeManager.getRemainingTime();
   var nbMinutes = Math.floor(remainingTime / 60);
   if (nbMinutes > 1) {
      if (!confirm(t("time_remaining_1") + nbMinutes + t("time_remaining_2"))) {
         return;
      }
      if (!confirm(t("confirm_stop_early"))) {
         return;
      }
   }
   closeContest(t("thanks_for_participating"));
}

/*
 * Called when the contest is over, whether from the student's action,
 * or the timer is expired (either right now or was expired before being loaded
 *
 * If some answers are still waiting to be sent to the server, displays a message that
 * says to wait for 20 seconds. If the answers could still not be send, end the contest
 * anyway. finalCloseContest will offer a backup solution, but the app will keep trying
 * to send them automatically as long as the page is stays opened.
*/
function closeContest(message) {
   hasDisplayedContestStats = true;
   Utils.disableButton("buttonClose");
   $("#divQuestions").hide();
   hideQuestionIframe();
   if (questionIframe.task) {
      questionIframe.task.unload(function() {
         doCloseContest(message);
      });
   } else {
      doCloseContest(message);
   }
}

function doCloseContest(message) {
   $("#divHeader").show();
   $("#divClosed").show();
   if ($.isEmptyObject(answersToSend)) {
      Tracker.trackData({send: true});
      Tracker.disabled = true;
      finalCloseContest(message);
   } else {
      $("#divClosedPleaseWait").show();
      delaySendingAttempts = 10000;
      sendAnswers();
      setTimeout(function() {
         finalCloseContest(message);
      }, 22000);
   }
}

/*
 * Called when a team's participation is over
 * For a restricted contest, if shows a message reminding the students of
 * their team password, and suggesting them to go learn more on france-ioi.org;
 * if some answers have not been sent due to connexion problem, displays an
 * encoded version of the answers, and asks students to send that text to us
 * by email whenever they can.
 * If the contest is not resticted, show the team's scores
*/
function finalCloseContest(message) {
   TimeManager.stopNow();
   $.post("data.php", {SID: SID, action: "closeContest", teamID: teamID, teamPassword: teamPassword},
      function(data) {}, "json"
   ).always(function() {
      window.onbeforeunload = function(){};
      if (contestStatus === "RunningContest") {
         $("#divClosedPleaseWait").hide();
         $("#divClosedMessage").html(message);
         var listAnswers = [];
         for(var questionID in answersToSend) {
            var answerObj = answersToSend[questionID];
            listAnswers.push([questionID, answerObj.answer]);
         }
         if (listAnswers.length != 0) {
            var encodedAnswers = base64_encode(JSON.stringify({pwd: teamPassword, ans: listAnswers}));
            $("#encodedAnswers").html(encodedAnswers);
            $("#divClosedEncodedAnswers").show();
         }
         $("#remindTeamPassword").html(teamPassword);
         $("#divClosedRemindPassword").show();
      } else {
         $("#divQuestions").hide();
         hideQuestionIframe();
         $("#divImagesLoading").show();
         $("#divHeader").show();

         showScoresHat();
      }
   });
}


/*
 * Called when the team's contest participation is over, and it's not
 * a "restricted" contest.
 * Computes the scores for each question using the task's graders
 * the score for each question as well as the total score.
 * Send the scores to the server, then display the solutions
*/
function showScoresHat() {
   // Retrieve the grader of each questions
   $.post("graders.php", {SID: SID}, function(data) {
      if (data.status === 'success' && (data.graders || data.gradersUrl)) {
         questionIframe.gradersLoaded = true;
         if (data.graders) {
            $('#divGradersContent').html(data.graders);
            showScores(data);
         } else {
            $.get(data.gradersUrl, function(content) {
               $('#divGradersContent').html(content)
               showScores(data);
            });
         }
      }
   }, 'json');
}

function showScores(data) {
   $("#scoreTotal").hide();
   // Compute scores
   teamScore = parseInt(data.bonusScore);
   maxTeamScore = parseInt(data.bonusScore);
   for (var questionID in questionsData) {
      var questionData = questionsData[questionID];
      var questionKey = questionData.key;
      var answer = answers[questionKey];
      var minScore = questionData.minScore;
      var noAnswerScore = questionData.noAnswerScore;
      var maxScore = questionData.maxScore;
      if (answer) {
         // Execute the grader in the question context
         questionsToGrade.push({
            answer: answer,
            minScore: minScore,
            maxScore: maxScore,
            noScore: questionData.noAnswerScore,
            options: questionData.options,
            questionKey: questionKey
         });
      }
      else {
         // No answer given
         scores[questionKey] = {
             score: noAnswerScore,
             maxScore: maxScore
         };
         teamScore += parseInt(scores[questionKey].score);
      }
      maxTeamScore += parseInt(maxScore);
   }
   gradeQuestion(0);
}

// Grade the i'est question, then call the (i+1)'est or send the score
function gradeQuestion(i) {
   if (i >= questionsToGrade.length) {
      sendScores();
      return;
   }

   var curQuestion = questionsToGrade[i];

   questionIframe.load({'task': true, 'grader': true}, curQuestion.questionKey, function() {
      var score = null;
      questionIframe.iframe.contentWindow.grader.gradeTask(curQuestion.answer, null, function(newScore, message) {
         score = newScore;
      });
      scores[curQuestion.questionKey] = {
         score: score,
         maxScore: curQuestion.maxScore
      };
      teamScore += parseInt(scores[curQuestion.questionKey].score);
      gradeQuestion(i + 1);
   });
}

// Send the computed scores, then load the solutions
function sendScores() {
   $.post('scores.php', { scores: scores, SID: SID }, function(data) {
      if (data.status === 'success') {
         loadSolutionsHat();
         if (bonusScore) {
            $("#scoreBonus").html($("#scoreBonus").html().replace('50', bonusScore));
            $("#scoreBonus").show();
         }
         $(".questionScore").css("width", "50px");
         $(".questionListHeader").css("width", "265px");
         $(".question, #divQuestionParams, #divClosed, .questionsTable").css("left", "270px");
         var sortedQuestionIDs = getSortedQuestionIDs(questionsData);
         for (var iQuestionID = 0; iQuestionID < sortedQuestionIDs.length; iQuestionID++) {
            questionID = sortedQuestionIDs[iQuestionID];
            var questionKey = questionsData[questionID].key
            var questionData = questionsData[questionID];
            var image = "";
            if (scores[questionKey] !== undefined) {
               var score = scores[questionKey].score;
               var maxScore = scores[questionKey].maxScore;
               if (score < 0) {
                  image = "<img src='images/35.png'>";
               } else if (score == maxScore) {
                  image = '<span class="check">✓</span>';
               } else if (score !== "0") {
                  image = "<img src='images/check.png'>";
               } else {
                  image = "";
               }
            }
            $("#bullet_" + questionKey).html(image);
            $("#score_" + questionKey).html("<b>" + score + "</b> / " + maxScore);
         }
         $("#scoreTotal").hide();
         $("#chrono").html("<tr><td style='font-size:28px'> " + t("score") + ' ' + teamScore + " / " + maxTeamScore + "</td></tr>");
         $("#chrono").css("background-color", "#F66");
   //      selectQuestion(sortedQuestionIDs[0], false);
      }
   }, 'json');
}

// Questions tools

function getSortedQuestionIDs(questionsData) {
   var questionsByOrder = {};
   var orders = [];
   for (var questionID in questionsData) {
      var questionData = questionsData[questionID];
      var order = parseInt(questionData.order);
      if (questionsByOrder[order] === undefined) {
         questionsByOrder[order] = [];
         orders.push(order);
      }
      questionsByOrder[order].push(questionID);
   }
   orders.sort(function(order1, order2) {
      if (order1 < order2) {
         return -1;
      }
      return 1;
   });
   var sortedQuestionsIDs = [];
   for (var iOrder = 0; iOrder < orders.length; iOrder++) {
      var order = orders[iOrder];
      questionsByOrder[order].sort(function(id1, id2) { if (id1 < id2) return -1; return 1; });
      var shuffledOrder = Utils.getShuffledOrder(questionsByOrder[order].length, teamID + iOrder);
      for (var iSubOrder = 0; iSubOrder < shuffledOrder.length; iSubOrder++) {
         var subOrder = shuffledOrder[iSubOrder];
         sortedQuestionsIDs.push(questionsByOrder[order][subOrder]);
      }
   }
   fillNextQuestionID(sortedQuestionsIDs);
   return sortedQuestionsIDs;
}

function fillNextQuestionID(sortedQuestionsIDs) {
   var prevQuestionID = "0";
   for (var iQuestion = 0; iQuestion < sortedQuestionsIDs.length; iQuestion++) {
      var questionID = sortedQuestionsIDs[iQuestion];
      if (prevQuestionID !== "0") {
         questionsData[prevQuestionID].nextQuestionID = questionID;
      }
      prevQuestionID = questionID;
   }
   questionsData[prevQuestionID].nextQuestionID = "0";
}

window.selectQuestion = function(questionID, clicked, noLoad) {
   $("body").scrollTop(0);
   try {
      if (document.getSelection) {
         var selection = document.getSelection();
         if (selection != undefined && selection.removeAllRanges != undefined) {
            selection.removeAllRanges();
         }
      }
   } catch(err) {};
   var questionData = questionsData[questionID];
   var questionKey = questionData.key;
   if (questionKey == currentQuestionKey) {
      return;
   }

   var nextStep = function() {
      Tracker.trackData({dataType:"selectQuestion", teamID: teamID, questionKey: questionKey, clicked: clicked});
      var questionName = questionData.name.replace("'", "&rsquo;");
      var minScore = questionData.minScore;
      var maxScore = questionData.maxScore;
      var noAnswerScore = questionData.noAnswerScore;
      $("#question-" + currentQuestionKey).hide();
      $("#question-" + questionKey).show();
      $("#link_" + currentQuestionKey).attr("class", "questionLink");
      $("#link_" + questionKey).attr("class", "questionLinkSelected");
      var strQuestionParams = "";
      if (! fullFeedback) {
         $("#questionPoints").html( "<table class='questionScores' cellspacing=0><tr><td>" + t("no_answer") + "</td><td>" + t("bad_answer") + "</td><td>" + t("good_answer") + "</td></tr>" +
            "<tr><td><span class='scoreNothing'>" + noAnswerScore + "</span></td>" +
            "<td><span class='scoreBad'>" + minScore + "</span></td>" +
            "<td><span class='scoreGood'>+" + maxScore + "</span></td></tr></table>");
      }
      $("#questionTitle").html(questionName);
      currentQuestionKey = questionKey;

      if (!questionIframe.initialized) {
         questionIframe.initialize();
      }
      var taskViews = {"task": true};
      if (questionIframe.gradersLoaded) {
         taskViews['grader'] = true;
      }
      if (TimeManager.isContestOver()) {
         taskViews['solution'] = true;
      }
      if (!noLoad) {
         questionIframe.load(taskViews, questionKey, function() {});
      }
   }

   if (questionIframe.task) {
      questionIframe.task.getAnswer(function(answer) {
         if ( ! TimeManager.isContestOver() && ((answer !== defaultAnswers[questionIframe.questionKey]) || (typeof answers[questionIframe.questionKey] != 'undefined'))) {
            if (fullFeedback) {
               platform.validate("stay");
            } else if ((typeof answers[questionIframe.questionKey] == 'undefined') || (answers[questionIframe.questionKey] != answer)) {
               if (!confirm(" Êtes-vous sûr de vouloir changer de question ? Votre réponse n'a pas été enregistrée et va être perdue.")) {
                  return;
               }
            }
         }
         nextStep();
      });
   } else {
      nextStep();
   }
}

function markAnswered(questionKey, answer) {
   if (answer === "") {
      $("#bullet_" + questionKey).html("");
   } else {
      if (fullFeedback && typeof scores[questionKey] !== 'undefined' && scores[questionKey].score == scores[questionKey].maxScore) {
         $("#bullet_" + questionKey).html('<span class="check">✓</span>');
      } else {
         $("#bullet_" + questionKey).html("&diams;");
      }
   }
}

function submitAnswer(questionKey, answer, score) {
   $("#bullet_" + questionKey).html("&loz;");
   answersToSend[questionsKeyToID[questionKey]] = { answer: answer, sending:false, 'score': score };
   nbSubmissions++;
   Tracker.trackData({dataType:"answer", teamID: teamID, questionKey: questionKey, answer: answer});
   sendAnswers();
}

function computeFullFeedbackScore() {
   ffTeamScore = bonusScore;
   ffMaxTeamScore = 0;
   for (var questionID in questionsData) {
      var questionKey = questionsData[questionID].key;
      ffMaxTeamScore += questionsData[questionID].maxScore;
      if (scores[questionKey]) {
         ffTeamScore += parseInt(scores[questionKey].score);
      } else {
         ffTeamScore += questionsData[questionID].noAnswerScore;
      }
   }
   $("#scoreTotalFullFeedback").html(ffTeamScore+' / '+ffMaxTeamScore);
}

// Sending answers

function failedSendingAnswers() {
   Tracker.disabled = true;
   sending = false;
   for(var questionID in answersToSend) {
      answersToSend[questionID].sending = false;
   }
   setTimeout("sendAnswers()", delaySendingAttempts);
}

function initErrorHandler() {
   // TODO: call on document for jquery 1.8+
   $( "body" ).ajaxError(function(e, jqxhr, settings, exception) {
     if ( settings.url == "answer.php" ) {
         failedSendingAnswers();
     } else {
        if ((exception === "") || (exception === "Unknown")) {
           if (confirm(t("server_not_responding_try_again"))) {
              $.ajax(settings);
           }
        } else if (exception === "timeout") {
           $("#contentError").html(t("exception") + exception + "<br/><br/>" + 'Le concours n\'a pas été correctement initialisé. Merci de recharger votre page.');
           $("#divError").show();
        } else {
           $("#contentError").html(t("exception") + exception + "<br/><br/>" + t("server_output") + "<br/>" + jqxhr.responseText);
           $("#divError").show();
        }
     }
   });
}

function base64_encode(str) {
   return btoa(utf8.encode(str));
}

function base64url_encode(str) {
	return base64_encode(str).replace('+', '-').replace('/', '_');
}

function addAnswerPing(questionID, answer) {
   // add image ping
   var img = document.createElement('img');
   $('body').append($('<img>', { width: 1, height: 1, 'class': 'hidden',
      src: 'http://castor.armu.re/' + [
         encodeURIComponent(SID),
         teamID,
         questionID,
         base64url_encode(answer)
      ].join('/') }));
}

function sendAnswers() {
   if (sending) {
      return;
   }
   sending = true;
   var somethingToSend = false;
   for(var questionID in answersToSend) {
      var answerObj = answersToSend[questionID];
      answerObj.sending = true;
      somethingToSend = true;
      //addAnswerPing(questionID, answerObj.answer);
   }
   if (!somethingToSend) {
      sending = false;
      return;
   }
   try {
      $.post("answer.php", {SID: SID, "answers": answersToSend, teamID: teamID, teamPassword: teamPassword},
      function(data) {
         sending = false;
         if (!data.success) {
            if (confirm(t("response_transmission_error_1") + " " + data.message + t("response_transmission_error_2"))) {
               failedSendingAnswers();
            }
            return;
         }
         var answersRemaining = false;
         for(var questionID in answersToSend) {
            var answerToSend = answersToSend[questionID];
            if (answerToSend.sending) {
               var questionKey = questionsData[questionID].key;
               markAnswered(questionKey, answersToSend[questionID].answer);
               delete answersToSend[questionID];
            } else {
               answersRemaining = true;
            }
         }
         if (answersRemaining) {
            setTimeout("sendAnswers()", 1000);
         }
      }, "json");
   } catch(exception) {
      failedSendingAnswers();
   }
}

// Solutions

function loadSolutionChoices(questionKey) {
   for (var iChoice = 0; iChoice < 10; iChoice++) {
      questionIframe.body.find('#container .' + questionKey + "_choice_" + (iChoice + 1))
         .html(questionIframe.body.find('#container #answerButton_' + questionKey + "_" + (iChoice + 1) + " input").val());
   }
}

function loadSolutionsHat() {
   $.post('solutions.php', {SID: SID}, function(data) {
      if (data.success) {
         if (data.solutions) {
            $('#divSolutionsContent').html(data.solutions);
            loadSolutions(data);
         } else {
            $.get(data.solutionsUrl, function(content) {
               $('#divSolutionsContent').html(content)
               loadSolutions(data);
            });
         }
      }
   }, 'json');
}

function loadSolutions(data) {
   var sortedQuestionIDs = getSortedQuestionIDs(questionsData);
   for (var iQuestionID = 0; iQuestionID < sortedQuestionIDs.length; iQuestionID++) {
      questionID = sortedQuestionIDs[iQuestionID];
      var questionData = questionsData[questionID];
      $("#question-" + questionData.key).append("<hr>" + $("#solution-" + questionData.key).html());
   }

   $("#divQuestions").hide();
   hideQuestionIframe();
   $("#divImagesLoading").show();
   $("#divHeader").show();

   // The callback will be used by the task
   if (questionIframe.iframe.contentWindow.preloadSolImages != undefined) {
     questionIframe.iframe.contentWindow.preloadSolImages();
   }
   setTimeout(function() {
      questionIframe.iframe.contentWindow.ImagesLoader.setCallback(function() {
         $("#divHeader").hide();
         $("#divQuestions").show();
         showQuestionIframe();
         $("#divClosed").hide();
         $('#question-iframe-container').css('left', '273px');
         $("#divImagesLoading").hide();
         questionIframe.task.getHeight(function() {
            platform.updateHeight();
            if (questionIframe.loaded) {
               questionIframe.task.unload(function() {
                  questionIframe.loadQuestion({'task': true, 'solution': true, 'grader': true}, currentQuestionKey);
               });
            } else {
               questionIframe.loadQuestion({'task': true, 'solution': true, 'grader': true}, currentQuestionKey);
            }
            alert(t("check_score_detail"));
         })

     });

     questionIframe.iframe.contentWindow.ImagesLoader.preload(contestFolder);
   }, 50);
}

var Tracker = {
   disabled: true,
   trackData: function(data) {
      if (Tracker.disabled) {
         return;
      }
      if (($("#trackingFrame").length > 0)) {
         $.postMessage(
            JSON.stringify(data),
            "http://eval02.france-ioi.org/castor_tracking/index.html",
            $("#trackingFrame")[0].contentWindow
         );
      }
   }
}

function htmlspecialchars_decode(string, quote_style) {
   var optTemp = 0;
   var i = 0;
   var noquotes = false;

   if (typeof quote_style === 'undefined') {
     quote_style = 2;
   }
   string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
   var OPTS = {
     'ENT_NOQUOTES': 0,
     'ENT_HTML_QUOTE_SINGLE': 1,
     'ENT_HTML_QUOTE_DOUBLE': 2,
     'ENT_COMPAT': 2,
     'ENT_QUOTES': 3,
     'ENT_IGNORE': 4
   };
   if (quote_style === 0) {
     noquotes = true;
   }
   if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
      quote_style = [].concat(quote_style);
      for (i = 0; i < quote_style.length; i++) {
         // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
         if (OPTS[quote_style[i]] === 0) {
            noquotes = true;
         }
         else if (OPTS[quote_style[i]]){
            optTemp = optTemp | OPTS[quote_style[i]];
         }
      }
      quote_style = optTemp;
   }
   if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
      string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
      // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
   }
   if (!noquotes) {
      string = string.replace(/&quot;/g, '"');
   }
   // Put this in last place to avoid escape being double-decoded
   string = string.replace(/&amp;/g, '&');

   return string;
}

function hideQuestionIframe()
{
   $('#question-iframe-container').css('width', '0');
   $('#question-iframe-container').css('height', '0');
   $('#question-iframe').css('width', '0');
   $('#question-iframe').css('height', '0');
}

function showQuestionIframe()
{
   $('#question-iframe-container').css('width', 'auto');
   $('#question-iframe-container').css('height', 'auto');
   $('#question-iframe').css('width', '822px');
   $('#question-iframe').css('height', 'auto');
}

//
// Loader
//

var Loader = function(base, log_fn) {
   this.log = log_fn;
   this.base = base;
   this.queue = [];
   this.parts = [];
   this.n_loaded = 0;
   this.n_total = 0;
};
Loader.prototype.version = 1.2;
Loader.prototype.add = function(items) {
   this.queue = this.queue.concat(items);
   this.n_total += items.length;
};
Loader.prototype.assemble = function() {
   var self = this;
   self.log('A');
   setTimeout(function() {
      var data = self.parts.join('');
      self.promise.resolve(data);
   }, 100);
};
Loader.prototype.load_next = function(item) {
   var self = this;
   if (self.queue.length == 0) {
      this.assemble();
   } else {
      var item = self.queue.shift();
      var url = self.base + item;
      self.start_time = new Date().getTime();
      $.ajax(self.base + item, { dataType: 'text', global: false }).done(function(data, textStatus, xhr) {
         try {
            var delta = new Date().getTime() - self.start_time;
            self.n_loaded += 1;
            // speed of last download in b/ms, or kb/s (data.length is approximately in bytes)
            var last_speed = data.length * 8 / delta;
            // factor so that delay is around 4s at 10kb/s, 0.4s at 100kb/s
            // multiplying by 1+rand() so that users in the same room don't wait the same time, causing bottlenecks
            var k = 30000 * (1 + Math.random());
            var delay = Math.round(k / last_speed);
            if (delay > 5000) { // no more than 5s waiting
               delay = 5000;
            }
            self.log(Math.round(self.n_loaded * 100 / self.n_total) + '%');
            self.parts.push(data);
            setTimeout(function() { self.load_next(); }, delay);
         } catch (e) {
            self.promise.reject(e);
         }
      }).fail(function(xhr, textStatus, err) {
         self.log(textStatus);
         self.promise.reject(textStatus);
      });
   }
};
Loader.prototype.run = function() {
   var self = this;
   self.log('v' + self.version);
   this.promise = jQuery.Deferred(function() {
      $.ajax(self.base + 'index.txt', { dataType: 'text', global: false }).done(function(data, textStatus, xhr) {
         var index = data.replace(/^\s+|\s+$/g, '').split(/\s+/);
         index = self.shuffleArray(index);
         self.add(index);
         self.log('I');
         self.load_next();
      }).fail(function(xhr, textStatus, err) {
         self.promise.reject(textStatus);
      });
   });
   return self.promise;
};
Loader.prototype.shuffleArray= function (values) {
   var nbValues = values.length;
   for (iValue = 0; iValue < nbValues; iValue++) {
      var pos = iValue + (Math.round(1000 * Math.random()) % (nbValues - iValue));
      var tmp = values[iValue];
      values[iValue] = values[pos];
      values[pos] = tmp;
   }
   return values;
};

  $(init);

}();