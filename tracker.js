// tracker.js - MEMORY FILE FOR LIVE AI GUIDE
// Created for Humaira Sardar - Smart Cane Project
// CODE INSIDE IS IN ENGLISH ONLY
// BUTTONS ARE IN ENGLISH ONLY - REMEMBER, PLACE
// VOICE GUIDE IS IN USER SELECTED LANGUAGE
// NO FIXED STEPS - Steps are learned from user's own walking
// NO GUESS - Turn is tracked REALLY from compass sensor + steps
// Turn warning is 1 step before turn - as user said

(function(){
  "use strict";

  // ---------- MEMORY ----------
  var MEMORY_KEY = "liveai_memory_routes_v3";
  var memory = { routes: [], places: [], lastRouteId: 0 };

  try{
    var saved = localStorage.getItem(MEMORY_KEY);
    if(saved){
      memory = JSON.parse(saved);
      if(!memory.routes) memory.routes = [];
      if(!memory.places) memory.places = [];
    }
  }catch(e){
    memory = { routes: [], places: [] };
  }

  function saveMemory(){
    try{ localStorage.setItem(MEMORY_KEY, JSON.stringify(memory)); }catch(e){}
  }

  // ---------- STATE ----------
  var isRecording = false;
  var currentRoute = null;
  var stepCount = 0;
  var lastStepTime = 0;
  var lastAccel = null;
  var lastTurnTime = 0;
  var lastHeading = null;
  var stairCount = 0;
  var lastStairTime = 0;
  var lastGps = null;
  var stepThreshold = 12;
  var stairThreshold = 9;
  var announcedTurns = {}; // to avoid repeating same turn warning

  // ---------- LANGUAGE ----------
  function getLang(){
    return window.CUSTOM_SELECTED_LANG || "ur-PK";
  }

  var PHRASES = {
    "ur-PK": {
      rememberStarted: "یاد کرنا شروع ہو گیا ہے۔ میں تمہارے قدم سے یہ راستہ واقعتاً یاد کر لوں گی۔",
      routeSaved: "راستہ یاد ہو گیا ہے۔ تمہارے قدم کے حساب سے کل قدم ",
      totalStairsText: " کل سیڑھیاں ",
      turnRightAfter: " قدم کے بعد دائیں مڑیں",
      turnLeftAfter: " قدم کے بعد بائیں مڑیں",
      // NEW - 1 step before turn, as user said
      turnRightIn1: "1 قدم دور تمہارا دائیں ٹرن آ گیا ہے",
      turnLeftIn1: "1 قدم دور تمہارا بائیں ٹرن آ گیا ہے",
      stairsAhead: "آگے سیڑھیاں ہیں۔ اوپر چلیں۔ سیڑھی 1",
      stair: "سیڑھی ",
      rememberObstacle: "یاد رکھیں، آگے ",
      isAhead: " ہے",
      obstacleIn3: " آگے 3 قدم میں ہے",
      stairsTotal: "آگے سیڑھیاں ہیں۔ کل سیڑھیاں ",
      memoryCleared: "یاد ختم کر دی گئی ہے",
      placeSaved: "جگہ یاد ہو گئی ہے۔ ",
      placeArrived: " آ گیا ہے",
      placeInSteps: " آگے تمہارے قدم کے حساب سے ",
      stepsLeft: " قدم میں ہے",
      askPlace: "یہ کون سی جگہ ہے؟ جیسے Kitchen, Washroom, Garage, Store, Father Room, Mother Room, Sister Room, Drawing Room, Library, Computer Lab, Shop"
    },
    "en-US": {
      rememberStarted: "Remember started. I will really track this route from your own steps.",
      routeSaved: "Route saved. Your total steps ",
      totalStairsText: " Total stairs ",
      turnRightAfter: " steps, turn right",
      turnLeftAfter: " steps, turn left",
      // NEW - 1 step before turn
      turnRightIn1: "1 step away, your right turn has come",
      turnLeftIn1: "1 step away, your left turn has come",
      stairsAhead: "Stairs ahead. Go up. Stair 1",
      stair: "Stair ",
      rememberObstacle: "Remember, ",
      isAhead: " ahead",
      obstacleIn3: " ahead in 3 steps",
      stairsTotal: "Stairs ahead. Total stairs ",
      memoryCleared: "Memory cleared",
      placeSaved: "Place saved. ",
      placeArrived: " arrived",
      placeInSteps: " ahead in your steps ",
      stepsLeft: " steps",
      askPlace: "Which place is this? Like Kitchen, Washroom, Garage, Store, Father Room, Mother Room, Sister Room, Drawing Room, Library, Computer Lab, Shop"
    },
    "hi-IN": {
      rememberStarted: "याद करना शुरू हो गया है। मैं तुम्हारे कदम से यह रास्ता सच में याद कर लूँगी।",
      routeSaved: "रास्ता याद हो गया है। तुम्हारे कदम के हिसाब से कुल कदम ",
      totalStairsText: " कुल सीढ़ियाँ ",
      turnRightAfter: " कदम के बाद दायें मुड़ें",
      turnLeftAfter: " कदम के बाद बायें मुड़ें",
      turnRightIn1: "1 कदम दूर तुम्हारा दायाँ टर्न आ गया है",
      turnLeftIn1: "1 कदम दूर तुम्हारा बायाँ टर्न आ गया है",
      stairsAhead: "आगे सीढ़ियाँ हैं। ऊपर चलें। सीढ़ी 1",
      stair: "सीढ़ी ",
      rememberObstacle: "याद रखें, आगे ",
      isAhead: " है",
      obstacleIn3: " आगे 3 कदम में है",
      stairsTotal: "आगे सीढ़ियाँ हैं। कुल सीढ़ियाँ ",
      memoryCleared: "याद खत्म कर दी गई है",
      placeSaved: "जगह याद हो गई है। ",
      placeArrived: " आ गया है",
      placeInSteps: " आगे तुम्हारे कदम के हिसाब से ",
      stepsLeft: " कदम में है",
      askPlace: "यह कौन सी जगह है? जैसे Kitchen, Washroom, Garage, Store, Father Room, Mother Room, Sister Room, Drawing Room, Library, Computer Lab, Shop"
    },
    "ar-SA": {
      rememberStarted: "بدأ التذكر. سأتتبع هذا الطريق حقا من خطواتك.",
      routeSaved: "تم حفظ الطريق. خطواتك ",
      totalStairsText: " مجموع الدرجات ",
      turnRightAfter: " خطوة، انعطف يمينا",
      turnLeftAfter: " خطوة، انعطف يسارا",
      turnRightIn1: "على بعد خطوة واحدة، انعطف يمينا",
      turnLeftIn1: "على بعد خطوة واحدة، انعطف يسارا",
      stairsAhead: "درج أمامك. اصعد. درجة 1",
      stair: "درجة ",
      rememberObstacle: "تذكر، أمامك ",
      isAhead: "",
      obstacleIn3: " أمامك بعد 3 خطوات",
      stairsTotal: "درج أمامك. مجموع الدرجات ",
      memoryCleared: "تم مسح الذاكرة",
      placeSaved: "تم حفظ المكان. ",
      placeArrived: " وصلت",
      placeInSteps: " أمامك بعد ",
      stepsLeft: " خطوة",
      askPlace: "ما هذا المكان؟ مثل Kitchen, Washroom, Garage, Store, Father Room, Mother Room, Sister Room, Drawing Room, Library, Computer Lab, Shop"
    }
  };

  function getPhrase(key){
    var lang = getLang();
    var pack = PHRASES[lang] || PHRASES["en-US"];
    return pack[key] || PHRASES["en-US"][key] || "";
  }

  function speakGuide(text){
    if(!text) return;
    if(!("speechSynthesis" in window)) return;
    try{
      window.speechSynthesis.cancel();
      setTimeout(function(){
        var u = new SpeechSynthesisUtterance(text);
        u.lang = getLang();
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }, 120);
    }catch(e){}
  }

  function vibrate(){
    if("vibrate" in navigator){
      try{ navigator.vibrate([200,100,200]); }catch(e){}
    }
  }

  function getCurrentObstacleName(){
    if(window.__LIVEAI_LAST_OBSTACLE__) return window.__LIVEAI_LAST_OBSTACLE__;
    return "";
  }

  function getObstacleNameInUserLang(englishId){
    if(window.getObjectName){
      try{ return window.getObjectName(englishId, getLang()); }catch(e){}
    }
    return englishId;
  }

  function getPlaceNameInUserLang(placeName){
    var lower = placeName.toLowerCase().trim();
    if(window.getObjectName){
      try{
        var t = window.getObjectName(lower, getLang());
        if(t && t !== lower) return t;
      }catch(e){}
    }
    return placeName;
  }

  // ---------- REMEMBER ----------
  function startRemember(){
    if(isRecording) return;
    isRecording = true;
    stepCount = 0;
    stairCount = 0;
    lastStepTime = 0;
    lastStairTime = 0;
    lastAccel = null;
    lastHeading = null;
    announcedTurns = {};

    currentRoute = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      totalSteps: 0,
      totalStairs: 0,
      points: [],
      turns: [],
      stairs: [],
      obstacles: [],
      places: [],
      gpsStart: lastGps,
      gpsEnd: null
    };

    speakGuide(getPhrase("rememberStarted"));
    vibrate();
    updateButtons();
  }

  function stopRemember(){
    if(!isRecording) return;
    isRecording = false;
    if(currentRoute){
      currentRoute.totalSteps = stepCount;
      currentRoute.totalStairs = stairCount;
      currentRoute.gpsEnd = lastGps;
      memory.routes.push(currentRoute);
      memory.lastRouteId = currentRoute.id;
      saveMemory();
      speakGuide(getPhrase("routeSaved") + stepCount + getPhrase("totalStairsText") + stairCount);
      currentRoute = null;
    }
    vibrate();
    updateButtons();
  }

  function toggleRemember(){
    if(isRecording){ stopRemember(); }
    else{ startRemember(); }
  }

  // ---------- PLACE ----------
  function saveCurrentPlace(){
    var name = prompt(getPhrase("askPlace"));
    if(!name) return;
    name = name.trim();
    if(!name) return;

    // REAL step count of THIS user at THIS moment - not fixed
    var placeObj = { name: name, step: stepCount, stair: stairCount, time: Date.now(), gps: lastGps };
    if(isRecording && currentRoute){
      currentRoute.places.push(placeObj);
    }
    memory.places.push({ name: name, step: stepCount, routeId: memory.lastRouteId, time: Date.now(), gps: lastGps });
    saveMemory();
    speakGuide(getPhrase("placeSaved") + getPlaceNameInUserLang(name));
    vibrate();
  }

  // ---------- STEP COUNTING - REAL, from mobile movement ----------
  function onMotion(e){
    if(!isRecording) return;
    var acc = e.accelerationIncludingGravity;
    if(!acc) return;
    var now = Date.now();
    if(now - lastStepTime < 350) return;

    var total = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
    if(lastAccel !== null){
      var diff = Math.abs(total - lastAccel);
      // REAL step - mobile actually moved
      if(diff > 2.2 && total > stepThreshold){
        lastStepTime = now;
        stepCount++;
        addPoint("STEP", stepCount);
        checkForReminder();
      }
      // REAL stair - bigger vertical jump
      if(diff > 3.5 && acc.y > stairThreshold){
        if(now - lastStairTime > 600){
          lastStairTime = now;
          stairCount++;
          if(currentRoute){
            currentRoute.stairs.push({ step: stepCount, stair: stairCount, time: now });
          }
          if(stairCount === 1){
            speakGuide(getPhrase("stairsAhead"));
          } else {
            speakGuide(getPhrase("stair") + stairCount);
          }
        }
      }
    }
    lastAccel = total;
  }

  // ---------- TURN DETECTION - REAL, from compass sensor ----------
  // This is NOT guess. When user REALLY turns, compass alpha changes more than 45 degrees.
  // We save that turn with the REAL step count at that moment.
  function onOrientation(e){
    if(!isRecording) return;
    if(e.alpha === null || e.alpha === undefined) return;
    var now = Date.now();
    if(now - lastTurnTime < 1500) return;
    if(lastHeading === null){ lastHeading = e.alpha; return; }
    var diff = e.alpha - lastHeading;
    if(diff > 180) diff -= 360;
    if(diff < -180) diff += 360;

    if(diff > 45){
      lastTurnTime = now;
      lastHeading = e.alpha;
      if(currentRoute){
        // Save REAL turn with REAL step
        currentRoute.turns.push({ step: stepCount, type: "RIGHT", time: now, heading: e.alpha });
      }
      speakGuide(stepCount + getPhrase("turnRightAfter"));
    }
    if(diff < -45){
      lastTurnTime = now;
      lastHeading = e.alpha;
      if(currentRoute){
        currentRoute.turns.push({ step: stepCount, type: "LEFT", time: now, heading: e.alpha });
      }
      speakGuide(stepCount + getPhrase("turnLeftAfter"));
    }
    lastHeading = e.alpha;
  }

  function startGps(){
    if(!("geolocation" in navigator)) return;
    try{
      navigator.geolocation.watchPosition(function(pos){
        lastGps = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, time: Date.now() };
        if(isRecording && currentRoute){
          currentRoute.points.push({ type: "GPS", step: stepCount, lat: lastGps.lat, lng: lastGps.lng, time: lastGps.time });
        }
      }, function(){}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    }catch(e){}
  }

  function addPoint(type, step){
    if(!currentRoute) return;
    if(step % 5 !== 0) return;
    var obs = getCurrentObstacleName();
    currentRoute.points.push({ type: type, step: step, obstacle: obs, time: Date.now() });
    if(obs){
      currentRoute.obstacles.push({ step: step, name: obs, time: Date.now() });
    }
  }

  // ---------- REMINDER - 1 STEP BEFORE TURN ----------
  function checkForReminder(){
    if(memory.routes.length === 0 && memory.places.length === 0) return;
    var last = memory.routes[memory.routes.length - 1];
    if(!last) return;

    // TURN - 1 step before, as user said
    // Example: turn saved at step 10, when user is at step 9, say "1 step away your right turn has come"
    for(var j=0; j<last.turns.length; j++){
      var t = last.turns[j];
      var key = t.step + "_" + t.type;
      if(announcedTurns[key]) continue;
      if(t.step - stepCount === 1){
        announcedTurns[key] = true;
        if(t.type === "RIGHT") speakGuide(getPhrase("turnRightIn1"));
        else speakGuide(getPhrase("turnLeftIn1"));
        vibrate();
        return;
      }
    }

    // PLACES
    for(var p=0; p<last.places.length; p++){
      var pl = last.places[p];
      if(pl.step === stepCount){
        speakGuide(getPlaceNameInUserLang(pl.name) + getPhrase("placeArrived"));
        return;
      }
      if(pl.step - stepCount === 3){
        speakGuide(getPlaceNameInUserLang(pl.name) + getPhrase("placeInSteps") + "3" + getPhrase("stepsLeft"));
        return;
      }
    }
    // OBSTACLES
    for(var i=0; i<last.obstacles.length; i++){
      var o = last.obstacles[i];
      if(o.step === stepCount){
        var name1 = getObstacleNameInUserLang(o.name);
        speakGuide(getPhrase("rememberObstacle") + name1 + getPhrase("isAhead"));
        return;
      }
      if(o.step - stepCount === 3){
        var name2 = getObstacleNameInUserLang(o.name);
        speakGuide(name2 + getPhrase("obstacleIn3"));
        return;
      }
    }
    if(last.totalStairs > 0 && stepCount === 1){
      speakGuide(getPhrase("stairsTotal") + last.totalStairs);
      return;
    }
  }

  // ---------- BUTTONS ----------
  function updateButtons(){
    var btn = document.getElementById("rememberBtn");
    if(btn){
      if(isRecording){
        btn.innerText = "STOP REMEMBER";
        btn.style.background = "#ef4444";
      } else {
        btn.innerText = "REMEMBER";
        btn.style.background = "#f59e0b";
        btn.style.color = "#000";
      }
    }
    var pBtn = document.getElementById("placeBtn");
    if(pBtn){
      pBtn.innerText = "PLACE";
    }
  }

  function createButtons(){
    if(!document.getElementById("rememberBtn")){
      var btn = document.createElement("button");
      btn.id = "rememberBtn";
      btn.innerText = "REMEMBER";
      btn.style.width = "100%";
      btn.style.border = "none";
      btn.style.padding = "14px";
      btn.style.fontSize = "16px";
      btn.style.borderRadius = "10px";
      btn.style.cursor = "pointer";
      btn.style.marginTop = "10px";
      btn.style.fontWeight = "700";
      btn.style.background = "#f59e0b";
      btn.style.color = "#000";
      btn.addEventListener("click", function(){
        if(typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function"){
          DeviceMotionEvent.requestPermission().then(function(){ toggleRemember(); }).catch(function(){ toggleRemember(); });
        } else {
          toggleRemember();
        }
      });
      var startBtn = document.getElementById("startBtn");
      if(startBtn && startBtn.parentNode){
        startBtn.parentNode.insertBefore(btn, startBtn.nextSibling);
      } else {
        document.body.appendChild(btn);
      }
    }

    if(!document.getElementById("placeBtn")){
      var pBtn = document.createElement("button");
      pBtn.id = "placeBtn";
      pBtn.innerText = "PLACE";
      pBtn.style.width = "100%";
      pBtn.style.border = "none";
      pBtn.style.padding = "14px";
      pBtn.style.fontSize = "16px";
      pBtn.style.borderRadius = "10px";
      pBtn.style.cursor = "pointer";
      pBtn.style.marginTop = "10px";
      pBtn.style.fontWeight = "700";
      pBtn.style.background = "#0284c7";
      pBtn.style.color = "#fff";
      pBtn.addEventListener("click", function(){ saveCurrentPlace(); });
      var rBtn = document.getElementById("rememberBtn");
      if(rBtn && rBtn.parentNode){
        rBtn.parentNode.insertBefore(pBtn, rBtn.nextSibling);
      } else {
        document.body.appendChild(pBtn);
      }
    }
    updateButtons();
  }

  window.LiveAITracker = {
    start: startRemember,
    stop: stopRemember,
    toggle: toggleRemember,
    savePlace: saveCurrentPlace,
    isRecording: function(){ return isRecording; },
    getStepCount: function(){ return stepCount; },
    getStairCount: function(){ return stairCount; },
    getRoutes: function(){ return memory.routes; },
    getPlaces: function(){ return memory.places; },
    clearMemory: function(){ memory.routes = []; memory.places = []; saveMemory(); speakGuide(getPhrase("memoryCleared")); }
  };

  window.addEventListener("load", function(){
    createButtons();
    startGps();
    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("deviceorientation", onOrientation);
  });

  if(document.readyState === "complete" || document.readyState === "interactive"){
    setTimeout(function(){ createButtons(); startGps(); }, 500);
    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("deviceorientation", onOrientation);
  }

})();