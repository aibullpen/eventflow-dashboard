/***** EventFlow.G - 최종 리팩토링 버전 *****/

// ==== 상수 & 헬퍼 함수 ====
const SHEET = {
  CONFIG: 'CONFIG',
  USERS: 'USERS',
  EVENTS: 'EVENTS',
  SPEAKERS: 'SPEAKERS',
  ATTENDEES: 'ATTENDEES',
  TASKS: 'TASKS',
  EMAILS: 'EMAILS',
  LOGS: 'LOGS'
};

const COL = {
  EVENTS: { ID: 0, USER_ID: 1, TITLE: 2, LOCATION: 3, DATES: 4, STATUS: 5, CAL_ID: 6, DRIVE_ID: 7 },
  USERS: { ID: 0, EMAIL: 1, NAME: 2, CREATED_AT: 3, LAST_LOGIN: 4 },
  SPEAKERS: { EVENT_ID: 0, NAME: 1, EMAIL: 2, STATUS: 3, CONFIRMED: 4, TOPIC: 5, FORM_URL: 6, RESP_TS: 7, MAT_FOLDER: 8 },
  ATTENDEES: { EVENT_ID: 0, NAME: 1, EMAIL: 2, STATUS: 3, RSVP: 4, FORM_URL: 5, RESP_TS: 6, CHECKIN: 7 },
  TASKS: { EVENT_ID: 0, TASK: 1, OWNER: 2, DEADLINE: 3, STATUS: 4, NOTES: 5 },
  EMAILS: { TEMPLATE_KEY: 0, SUBJECT: 1, BODY: 2 },
  LOGS: { EVENT_ID: 0, TS: 1, ACTION: 2, STATUS: 3, MESSAGE: 4, COUNT: 5, USER: 6 }
};

// 스프레드시트 객체
function ss() {
  const SPREADSHEET_ID = '1UxiA4NFeGKsa0tCU7m5TWe8WudgWnYQTUxcWHpATw_s';
  try { return SpreadsheetApp.openById(SPREADSHEET_ID); } 
  catch(e) { return SpreadsheetApp.getActive(); }
}
function getSheet(name){ return ss().getSheetByName(name); }

// HTML include
function include_(filename){ return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

// 문자열 / 날짜 안전 처리
function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function safeToString(v){ return (v instanceof Date) ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(v||''); }
function toDateFlexible(val){ 
  if(val instanceof Date) return val; 
  const d = new Date(String(val).replace(' ','T')); 
  if(!isNaN(d.getTime())) return d; 
  throw new Error('날짜 파싱 실패: '+val);
}

// ==== 사용자 & 인증 ====
function findOrCreateUser(email,name){
  const sh = getSheet(SHEET.USERS);
  const data = sh.getDataRange().getValues();
  const userEmail = email.toLowerCase();
  for(let i=1;i<data.length;i++){
    if(String(data[i][COL.USERS.EMAIL]).toLowerCase()===userEmail){
      sh.getRange(i+1,COL.USERS.LAST_LOGIN+1).setValue(new Date());
      return { user_id: data[i][COL.USERS.ID], name:data[i][COL.USERS.NAME], email };
    }
  }
  const userId = Utilities.getUuid();
  const now = new Date();
  sh.appendRow([userId,email,name,now,now]);
  return { user_id:userId, name, email };
}

function apiLogin(idToken,name){
  if(!idToken) throw new Error("ID Token 필요");
  const email = idToken;
  const user = findOrCreateUser(email,name);
  return { ok:true, message:'로그인 성공', user:{ id:user.user_id, name:user.name, email:user.email } };
}

// ==== 이벤트 생성 & 조회 ====
function apiCreateNewEvent(user_id,title,location,dates){
  const sh = getSheet(SHEET.EVENTS);
  const eventId = Utilities.getUuid();
  const now = new Date();
  const datesString = (dates||[]).map(d=>Utilities.formatDate(new Date(d),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm')).join(';');
  sh.appendRow([eventId,user_id,title,location,datesString,'SETUP_COMPLETE','','',now]);
  return { ok:true, message:`행사 [${title}] 생성 완료`, event_id:eventId };
}

function apiGetUserEvents(user_id){
  const sh = getSheet(SHEET.EVENTS);
  const data = sh.getDataRange().getValues().slice(1);
  const events = data.filter(r=>String(r[COL.EVENTS.USER_ID])===String(user_id)).map(r=>({
    id:r[COL.EVENTS.ID], title:r[COL.EVENTS.TITLE], date:r[COL.EVENTS.DATES], status:r[COL.EVENTS.STATUS]
  }));
  return { ok:true, events };
}

// ==== 로그 ====
function ensureLogSheet(){
  let sh = getSheet(SHEET.LOGS);
  if(!sh){ sh=ss().insertSheet(SHEET.LOGS); sh.getRange(1,1,1,7).setValues([['EVENT_ID','TS','ACTION','STATUS','MESSAGE','COUNT','USER']]); }
  return sh;
}
function logAction(action,status,message,count,eventId){
  const sh = ensureLogSheet();
  const user = (Session.getActiveUser&&Session.getActiveUser().getEmail())||'';
  const ts = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss');
  sh.appendRow([eventId||'-',ts,action,status,message||'',count||'',user]);
}
function getRecentLogs(limit){
  const sh = ensureLogSheet();
  const rows = sh.getDataRange().getValues().slice(1).reverse();
  return rows.slice(0,limit||50).map(r=>({
    event_id:r[0], ts:r[1], action:r[2], status:r[3], message:r[4], count:r[5], user:r[6]
  }));
}

// ==== Config ====
function getConfigMap(){
  const rows = getSheet(SHEET.CONFIG).getDataRange().getValues().slice(1);
  const map = {};
  rows.forEach(r=>{ if(r[0]) map[String(r[0]).trim()]=String(r[1]||'').trim(); });
  return map;
}
function setConfigValue(key,value){
  const sh = getSheet(SHEET.CONFIG);
  const vals = sh.getDataRange().getValues();
  for(let i=1;i<vals.length;i++){ if(String(vals[i][0]).trim()===key){ sh.getRange(i+1,2).setValue(value); return; } }
  sh.appendRow([key,value]);
}

// ==== Web App API ====
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    .setHeader("Access-Control-Max-Age", "3600");
}



function doPost(e){
  let req;
  try{ req = JSON.parse(e.postData.contents); } 
  catch(err){ return createJSONResponse({ok:false,error:'잘못된 JSON 형식'}); }

  let result={ok:false,error:`Unknown action: ${req.action}`};
  try{
    switch(req.action){
      case 'login': result=apiLogin(req.idToken,req.name); break;
      case 'create_new_event': result=apiCreateNewEvent(req.user_id,req.title,req.location,req.dates); logAction('CREATE_EVENT','OK',result.message,null,req.user_id); break;
      case 'get_summary_data': result=apiGetSummaryData(); break;
    }
  }catch(err){ logAction(req.action,'ERROR',err.message); result={ok:false,error:err.message}; }
  return createJSONResponse(result);
}

function doGet(e){
  if(e.parameter.action){
    let result={ok:false,error:'Unknown GET action'};
    try{
      switch(e.parameter.action){
        case 'get_summary_data': result=apiGetSummaryData(); break;
      }
    }catch(err){ logAction(e.parameter.action,'ERROR',err.message); result={ok:false,error:err.message}; }
    return createJSONResponse(result);
  }
  return HtmlService.createTemplateFromFile('index').evaluate().setTitle('EventFlow Dashboard').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    .setHeader("Access-Control-Max-Age", "3600");
}


// ==== Summary ====
function apiGetSummaryData(){
  const EMPTY={config:{title:'(제목없음)',location:'',confirmedDatetime:''},counts:{attending:0,invited:0,registered:0,tasksTotal:0,tasksOpen:0},speakers:[],attendees:[],tasks:[],logs:[]};
  try{
    const cfg=getConfigMap();
    const config={title:cfg.EVENT_TITLE||'(제목없음)', location:cfg.EVENT_LOCATION||'', confirmedDatetime:cfg.EVENT_CONFIRMED_AT||''};
    const sp=getSheet(SHEET.SPEAKERS)?.getDataRange().getValues().slice(1)||[];
    const at=getSheet(SHEET.ATTENDEES)?.getDataRange().getValues().slice(1)||[];
    const tk=getSheet(SHEET.TASKS)?.getDataRange().getValues().slice(1)||[];

    const speakers=sp.map(r=>({name:r[COL.SPEAKERS.NAME],email:r[COL.SPEAKERS.EMAIL],status:r[COL.SPEAKERS.STATUS],confirmed:r[COL.SPEAKERS.CONFIRMED],topic:r[COL.SPEAKERS.TOPIC]}));
    const attendees=at.map(r=>({name:r[COL.ATTENDEES.NAME],email:r[COL.ATTENDEES.EMAIL],status:r[COL.ATTENDEES.STATUS],rsvp:r[COL.ATTENDEES.RSVP]}));
    const tasks=tk.map(r=>({task:r[COL.TASKS.TASK],owner:r[COL.TASKS.OWNER],deadline:r[COL.TASKS.DEADLINE],status:r[COL.TASKS.STATUS],notes:r[COL.TASKS.NOTES]}));

    const counts={invited:speakers.filter(s=>s.status==='INVITED').length, registered:attendees.length, attending:attendees.filter(a=>isAttending(a.rsvp)).length, tasksTotal:tasks.length, tasksOpen:tasks.filter(t=>String(t.status).toLowerCase()!=='done').length};
    const logs=getRecentLogs(50);
    return {ok:true,config,counts,speakers,attendees,tasks,logs};
  }catch(e){ return {ok:false,error:e.message||String(e)}; }
}

function isAttending(v){ const s=String(v||'').toLowerCase().replace(/\s/g,''); return ['참석','참가','yes','y','true','1','참석예정'].some(w=>s.indexOf(w)>=0); }
