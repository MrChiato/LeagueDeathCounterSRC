import axios from 'axios';
import {RIOT_API} from './APIKEYS.js'

const apiKey = RIOT_API; //Riot api key, should come from a backend env file or something. I don't have a backend since I am not hosting this anywhere other than locally, if you got this from github fill in your api key in APIKEYS.js, or just write it here.
let currentAccountID = "";
let currentSummonerID = "";
let currentPuuid = "";
let currentSummonerName = ""; //This value should come from our search box
let amountOfMatchesLoaded = 0
let currentUserDeaths = 0;
const timer = ms => new Promise(res => setTimeout(res, ms)); //We need a timer to limit api calls
const DEBUG = true; //Toggle console outputs
const matchesToCount = 100;
const highScoreCount = 10;

//Text fields
let loadedNameText = "";
let loadedMatchesText = "";
let loadedDeathsText = "";
let loadedAverageDeaths = "";
let loadedTimeText = "";

//A quick function that allows toggling all console outputs for debugging
function ConsoleDebug(...args){
    if (DEBUG == true){
        for (var arg in args)
            console.log(args[arg])
    }
}

//When button is clicked this is what happens
export function loadButtonClicked(){
  let inputBox = document.getElementById("UserInputName");
  let inputBoxValue = inputBox.value;
  ConsoleDebug("input: ", inputBoxValue);
  getProfileData(inputBoxValue);
  document.getElementById("errorText").innerHTML = "";    
}

export function updateButtonClicked(){  
  updateAllUsers()
}

//We get the puuid for the summoner name, this is used in riots api to look up everything else.
async function getProfileData(SummonerName){
  await axios.get('https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+SummonerName+'?api_key='+apiKey)
    .then(response => {      
      currentAccountID = response.data.accountId;
      currentPuuid = response.data.puuid;
      getMatchHistory(currentPuuid);
      currentSummonerID = response.data.id;
    })
    .catch((error) => {
        ConsoleDebug("Error getting profile data: ", error)
        if (error["code"] === "ERR_NETWORK"){
            //We can assume this means we either send too many requests or the name that was input doesnt exist
            document.getElementById("errorText").innerHTML = "We ran into a problem retrieving the data: check if the username is correct or try again in a bit. Error Code: "+error["code"];
        }
        else if (error["code"] === "ERR_BAD_REQUEST"){
            //We can assume this means a problem with the code, or (very unlikely) the api changed host name
            document.getElementById("errorText").innerHTML = "Network error! Try again later or contact the site owner. Error Code: "+error["code"];
        }
        return;
    })
};

//Here we get the information about our player from the specific match, in this case we only care about deaths. This could easily be rewritten to allow any input to get things such as kills.
async function getMatchDetail(currentMatchID){
  await axios.get('https://europe.api.riotgames.com/lol/match/v5/matches/'+currentMatchID+'?api_key='+apiKey)
    .then(response => {
      let participantsArray = response.data.metadata.participants;
      let currentUserParticipantID = (participantsArray.indexOf(currentPuuid));
      let currentUserStats = response.data.info.participants[currentUserParticipantID]

      let currentUserTimespentDead = currentUserStats["totalTimeSpentDead"]
      currentUserDeaths = currentUserStats["deaths"]
      ConsoleDebug("timespent: ", currentUserTimespentDead)
      let currentUserData = {
        deaths: currentUserDeaths,
        timeSpent: currentUserTimespentDead
      }
      localStorage.setItem('deaths', JSON.stringify(currentUserData));
      ConsoleDebug(currentMatchID+" : "+currentUserDeaths);
      ConsoleDebug(currentMatchID+" : "+currentUserTimespentDead);
  })
    .catch((error) => {
        ConsoleDebug("Error getting match data: ", error)
        document.getElementById("errorText").innerHTML = "We ran into a problem finding the match, we might not be able to communicate with riots server, try again later. "+error["code"];
    })
};

//Here we are getting all the stored matches in riots api. Max we can get is 100. Then we loop through each and get the amount of deaths in that specifc match.
async function getMatchHistory(currentPuuid){
  await axios.get('https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/'+currentPuuid+'/ids?start=0&count='+matchesToCount+'&api_key='+apiKey)
    .then(async response => {
      let loadedMatchHistoryArray = getMatches(currentPuuid)
      if (loadedMatchHistoryArray == null)
        loadedMatchHistoryArray = []
      let matchHistoryArray = response.data
      let curDeaths = JSON.parse(localStorage.getItem('deaths'));
      let inputButton = document.getElementById("loadButton");
      let inputBox = document.getElementById("UserInputName");

      let totalDeaths = 0;
      let totalTimeSpent = 0;
      amountOfMatchesLoaded = 0;
      ConsoleDebug("button: ", inputButton)
      let loadTimer = 0;
      for (var match in matchHistoryArray){

        inputButton.disabled = true;
        inputBox.disabled = true;
        inputButton.innerText = "Loading matches.. ("+loadTimer+"/"+matchHistoryArray.length+")";
        ConsoleDebug("Loading matches.."+loadTimer+"/"+matchHistoryArray.length);
        loadTimer++;

        if (!loadedMatchHistoryArray.some(e => e.match_ID === matchHistoryArray[match])){
          await timer(1200); //We need to limit our amount of api calls since we can do a max of 100 calls every 2 minutes.
          await getMatchDetail(matchHistoryArray[match])
          curDeaths = JSON.parse(localStorage.getItem('deaths'));
          let data = {
            match_ID: matchHistoryArray[match],
            deaths: curDeaths["deaths"],
            timeSpentDead: curDeaths["timeSpent"]
          }
          loadedMatchHistoryArray.push(data)
        }
      }
      for (var match in loadedMatchHistoryArray){
        totalDeaths += parseInt(loadedMatchHistoryArray[match]['deaths']);
        totalTimeSpent += parseInt(loadedMatchHistoryArray[match]['timeSpentDead']);
        amountOfMatchesLoaded++;
      }
      inputButton.disabled = false;
      inputBox.disabled = false;


      inputButton.innerText = "Load deaths";

      ConsoleDebug(currentSummonerName)
      ConsoleDebug("Matches loaded: ", amountOfMatchesLoaded)
      ConsoleDebug("total deaths: ", totalDeaths)

      loadedNameText = document.getElementById("UserInputName").value;
      loadedMatchesText = ("Matches loaded: " + amountOfMatchesLoaded);
      loadedDeathsText = ("Total deaths: " +totalDeaths);
      loadedTimeText = ("Total time spent dead (in minutes): " +(totalTimeSpent/60).toFixed(0));
      loadedAverageDeaths = ("Average deaths per game: "+(totalDeaths / amountOfMatchesLoaded).toFixed(2))

      document.getElementById("loadedName").innerHTML = loadedNameText.toUpperCase();
      document.getElementById("loadedMatches").innerHTML = loadedMatchesText;
      document.getElementById("loadedDeaths").innerHTML = loadedDeathsText;
      document.getElementById("timeDead").innerHTML = loadedTimeText;
      document.getElementById("averageDeaths").innerHTML = loadedAverageDeaths;

      saveMatches(currentPuuid, loadedMatchHistoryArray)
    })
    .catch((error) => {
        ConsoleDebug("Error getting match history: ", error)
        document.getElementById("errorText").innerHTML = "Could not load match history, has the user played any games recently? If yes we might be having problems communicating with riots match history server "+error["code"];
    })
};

//Saving the matches in local storage, since we can only do a certain amount of api calls we store the matches after they have been loaded so we can get just get them from localstorage instead of the api
async function saveMatches(puuid, data){
  window.localStorage.setItem(puuid, JSON.stringify(data))
}

//Here we get the matches from localstorage
function getMatches(puuid){
  let loadedData = JSON.parse(window.localStorage.getItem(puuid))
  return loadedData
}


export async function deathLeaderboard(){
  
  ConsoleDebug("length: ", localStorage.length);
  let allUsersInStorage = []
  for (var i = 0; i < localStorage.length; i++){
    let currentIndex = localStorage.key(i);
    if (currentIndex !== "deaths" && currentIndex !== "Highscores"){
      ConsoleDebug("ls: ", currentIndex);
      
      let userMatches = getMatches(currentIndex);
      let userDeaths = 0;
      let matchCount = 0;
      let averageDeaths = 0;
      let userName = "";
      let timeDead = 0;

      for (var match in userMatches){
        userDeaths += parseInt(userMatches[match]['deaths']);
        timeDead += parseInt(userMatches[match]['timeSpentDead']);
        matchCount++;
      }
      averageDeaths = (userDeaths / matchCount).toFixed(2);
      timeDead = (timeDead/60).toFixed(0);

      ConsoleDebug("this highscore deaths: ",userDeaths);

      let userData = {
        user_ID: currentIndex,
        Name: userName,
        Deaths: userDeaths,
        Matches: matchCount,
        Deathtime: timeDead,  
        Average: averageDeaths
      }
      allUsersInStorage.push(userData)
      
    }
  }
  allUsersInStorage.sort((a, b) => b.Deaths - a.Deaths);
  ConsoleDebug("Users in storage: ",allUsersInStorage);

  let highScores = [];

  for (let i = 0; i<=highScoreCount; i++){
    if (allUsersInStorage[i] != undefined){
      await axios.get('https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/'+allUsersInStorage[i].user_ID+'?api_key='+apiKey)
      .then(response => {
        ConsoleDebug("highscore name api response: ", response.data["name"]);
        let userName = response.data["name"];
        allUsersInStorage[i].Name = userName;
        delete allUsersInStorage[i].user_ID;
        if ("Name" in allUsersInStorage[i])
          highScores.push(allUsersInStorage[i]);
      })
    .catch(error => {
      ConsoleDebug(error);
    })
    }
  }
  ConsoleDebug("Highescores: ", highScores);
  window.localStorage.setItem("Highscores", JSON.stringify(highScores));
}

//Updates all users we have stored in localstorate
async function updateAllUsers(){
  for (var i = 0; i < localStorage.length; i++){
    let currentIndex = localStorage.key(i);
    if (currentIndex !== "deaths" && currentIndex !== "Highscores"){
      ConsoleDebug("updated user: ", currentIndex)
      await getMatchHistory(currentIndex);
    }
  }
}