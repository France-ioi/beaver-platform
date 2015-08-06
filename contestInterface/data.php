<?php
/* Copyright (c) 2012 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

include_once("../shared/common.php");
include_once("../shared/tinyORM.php");
include_once("common_contest.php");
use Aws\DynamoDb\Exception;

function loadPublicGroups($db) {
   restartSession();
   $stmt = $db->prepare("SELECT `group`.`name`, `group`.`code`, `contest`.`year`, `contest`.`level` ".
      "FROM `group` JOIN `contest` ON (`group`.`contestID` = `contest`.`ID`) WHERE `isPublic` = 1 AND `contest`.`status` <> 'Hidden'");
   $stmt->execute(array());
   $groups = array();
   while ($row = $stmt->fetchObject()) {
      $groups[] = $row;
   }
   echo json_encode(array("success" => true, "groups" => $groups, "SID" => session_id()));
}

function loginTeam($db, $password) {
   echo json_encode(commonLoginTeam($db, $password));
}

function getGroupTeams($db, $groupID) {
   $stmt = $db->prepare("SELECT `team`.`ID`, `contestant`.`lastName`, `contestant`.`firstName` FROM `contestant` LEFT JOIN `team` ON `contestant`.`teamID` = `team`.`ID` WHERE `team`.`groupID` = ?");
   $stmt->execute(array($groupID));
   $teams = array();
   while ($row = $stmt->fetchObject()) {
      if (!isset($teams[$row->ID])) {
         $teams[$row->ID] = (object)array("nbContestants" => 0, "contestants" => array());
      }
      $teams[$row->ID]->nbContestants++;
      $contestant = (object)array("lastName" => htmlentities(utf8_decode($row->lastName)), "firstName" => htmlentities(utf8_decode($row->firstName)));
      $teams[$row->ID]->contestants[] = $contestant;
   }
   return $teams;
}

function openGroup($db, $password, $getTeams) {
   $query = "SELECT `group`.`ID`, `group`.`name`, `group`.`bRecovered`, `group`.`contestID`, `group`.`isPublic`, `group`.`schoolID`, `group`.`startTime`, TIMESTAMPDIFF(MINUTE, `group`.`startTime`, NOW()) as `nbMinutesElapsed`,  `contest`.`nbMinutes`, `contest`.`bonusScore`, `contest`.`allowTeamsOfTwo`, `contest`.`fullFeedback`, `contest`.`nextQuestionAuto`, `contest`.`folder`, `contest`.`status` FROM `group` JOIN `contest` ON (`group`.`contestID` = `contest`.`ID`) WHERE `code` = ?";
   $stmt = $db->prepare($query);
   $stmt->execute(array($password));
   $row = $stmt->fetchObject();
   if (!$row) {
      return false;
   }
   if ($row->status == "FutureContest") {
      echo json_encode((object)array("success" => false, "message" => "Le concours de ce groupe n'est pas encore ouvert."));
      return true;
   }
   if ($row->status == "Closed" || $row->status == 'PreRanking') {
      echo json_encode((object)array("success" => false, "message" => "Le concours de ce groupe n'est pas disponible actuellement."));
      return true;
   }
   $groupID = $row->ID;
   $schoolID = $row->schoolID;
   $contestID = $row->contestID;
   $contestFolder = $row->folder;
   $contestStatus = $row->status;
   $name = $row->name;
   $nbMinutes = $row->nbMinutes;
   $bonusScore = $row->bonusScore;
   $allowTeamsOfTwo = $row->allowTeamsOfTwo;
   $fullFeedback = $row->fullFeedback;
   $nextQuestionAuto = $row->nextQuestionAuto;
   $isPublic = $row->isPublic;
   if ($row->startTime === null) {
      $nbMinutesElapsed = 0;
   } else {
      $nbMinutesElapsed = $row->nbMinutesElapsed;
   }
   if ($getTeams === "true") {
      $teams = getGroupTeams($db, $groupID);
   } else {
      $teams = "";
   }
   $_SESSION["groupID"] = $groupID;
   $_SESSION["schoolID"] = $schoolID;
   $_SESSION["contestID"] = $contestID;
   $_SESSION["contestFolder"] = $contestFolder;
   $_SESSION["contestStatus"] = $contestStatus;
   $_SESSION["nbMinutes"] = $nbMinutes;
   $_SESSION["bonusScore"] = $bonusScore;
   $_SESSION["allowTeamsOfTwo"] = $allowTeamsOfTwo;
   $_SESSION["fullFeedback"] = $fullFeedback;
   $_SESSION["nextQuestionAuto"] = $nextQuestionAuto;
   $_SESSION["groupClosed"] = (($nbMinutesElapsed > 60) && (!$isPublic));
   echo json_encode((object)array(
      "success" => true,
      "groupID" => $groupID,
      "contestID" => $contestID, 
      "contestFolder" => $contestFolder, 
      "contestStatus" => $contestStatus, 
      "name" => $name,
      "teams" => $teams,
      "nbMinutes" => $nbMinutes,
      "bonusScore" => $bonusScore,
      "allowTeamsOfTwo" => $allowTeamsOfTwo,
      "fullFeedback" => $fullFeedback,
      'bRecovered' => $row->bRecovered,
      "nbMinutesElapsed" => $nbMinutesElapsed,
      "isPublic" => $isPublic));
   return true;
}

function reloginTeam($db, $password, $teamID) {
   global $tinyOrm, $config;
   $stmt = $db->prepare("SELECT `group`.`password`, `contest`.`status` FROM `group` JOIN `contest` ON (`group`.`contestID` = `contest`.`ID`) WHERE `group`.`ID` = ?");
   $stmt->execute(array($_SESSION["groupID"]));
   $row = $stmt->fetchObject();
   if (!$row) {
      echo json_encode(array("success" => false, "message" => "Groupe invalide"));
   } else if ($row->password !== $password) {
      echo json_encode(array("success" => false, "message" => "Mot de passe invalide"));
   } else if ($row->status == "Closed" || $row->status == "PreRanking") {
      echo json_encode(array("success" => false, "message" => "Concours fermé"));      
   } else {
      $stmt = $db->prepare("SELECT `password` FROM `team` WHERE `ID` = ? AND `groupID` = ?");
      $stmt->execute(array($teamID, $_SESSION["groupID"]));
      $row = $stmt->fetchObject();
      if (!$row) {
         echo json_encode(array("success" => false, "message" => "Équipe invalide pour ce groupe"));
      } else {
         if ($config->db->use == 'dynamoDB') {
            try {
               $teamDynamoDB = $tinyOrm->get('team', array('ID', 'groupID'), array('ID' => $teamID));
            } catch (\Aws\DynamoDb\Exception $e) {
               error_log($e->getMessage . " - " . $e->getCode());
               error_log('DynamoDB error retrieving: '.$teamID);
            }
            if (!count($teamDynamoDB) || $teamDynamoDB['groupID'] != $_SESSION["groupID"]) {
               error_log('team.groupID différent entre MySQL et DynamoDB! nb résultats DynamoDB: '.count($teamDynamoDB).(count($teamDynamoDB) ? ', $teamDynamoDB[groupID]'.$teamDynamoDB['groupID'].', $_SESSION[groupID]'.$_SESSION["groupID"] : ''));
            }
         }
         $_SESSION["teamID"] = $teamID;
         $_SESSION["teamPassword"] = $row->password;
         return true;
      }
   }
   return false;
}

function createTeam($db, $contestants) {
   global $tinyOrm, $config;
   if ($_SESSION["groupClosed"]) {
      error_log("Hack attempt ? trying to create team on closed group ".$_SESSION["groupID"]);
      echo json_encode(array("success" => false, "message" => "Groupe fermé"));
      return;
   }
   if (isset($_SESSION["userCode"])) {
      $password = $_SESSION["userCode"];
   } else {
      $password = genAccessCode($db);
   }
   $stmt = $db->prepare("INSERT INTO `team` (`groupID`, `password`) VALUES (?, ?)");
   $stmt->execute(array($_SESSION["groupID"], $password));
   $teamID = $db->lastInsertId();
   if ($config->db->use == 'dynamoDB') {
      try {
         $tinyOrm->insert('team', array(
            'ID'       => $teamID,
            'groupID'  => $_SESSION["groupID"],
            'password' => $password,
         ));
      } catch (\Aws\DynamoDb\Exception $e) {
         error_log($e->getMessage . " - " . $e->getCode());
         error_log('DynamoDB error creating team, teamID: '.$teamID);
      }
   }

   $stmt = $db->prepare("UPDATE `group` SET `startTime` = NOW() WHERE `group`.`ID` = ? AND `startTime` IS NULL");
   $stmt->execute(array($_SESSION["groupID"]));
   $stmt = $db->prepare("UPDATE `group` SET `nbTeamsEffective` = `nbTeamsEffective` + 1, `nbStudentsEffective` = `nbStudentsEffective` + ? WHERE `ID` = ?");
   $stmt->execute(array(count($contestants), $_SESSION["groupID"]));

   $_SESSION["teamID"] = $teamID;
   $_SESSION["teamPassword"] = $password;
   foreach ($contestants as $contestant) {
      if (!isset($contestant["grade"])) {
         $contestant["grade"] = -2;
      }
      list($contestant["firstName"], $contestant["lastName"], $saniValid, $trash) = 
         DataSanitizer::formatUserNames($contestant["firstName"], $contestant["lastName"]);
      $stmt = $db->prepare("
         INSERT INTO `contestant` (`lastName`, `firstName`, `genre`, `grade`, `teamID`, `cached_schoolID`, `saniValid`) 
         VALUES (?, ?, ?, ?, ?, ?, ?)");
      $stmt->execute(array($contestant["lastName"], $contestant["firstName"], $contestant["genre"], $contestant["grade"], $teamID, $_SESSION["schoolID"], $saniValid));
   }
   echo json_encode((object)array("success" => true, "teamID" => $teamID, "password" => $password));
}

function loadContestData($db) {
   global $tinyOrm, $config;
   $teamID = $_SESSION["teamID"];
   $stmt = $db->prepare("UPDATE `team` SET `startTime` = NOW() WHERE `ID` = :teamID AND `startTime` IS NULL");
   $stmt->execute(array("teamID" => $teamID));
   if ($config->db->use == 'dynamoDB') {
      $stmt = $db->prepare("SELECT `startTime` FROM `team` WHERE `ID` = :teamID");
      $stmt->execute(array("teamID" => $teamID));
      $row = $stmt->fetchObject();
      try {
         $tinyOrm->update('team', array('startTime' => $row->startTime), array('ID'=>$teamID, 'startTime'=>null));
      } catch (\Aws\DynamoDb\Exception $e) {
         error_log($e->getMessage . " - " . $e->getCode());
         error_log('DynamoDB error updating team for teamID: '.$teamID);
      }
   }

   $questionsData = getQuestions($db, $_SESSION["contestID"]);

   //$stmt = $db->prepare("SELECT `questionID`, `answer` FROM `team_question` WHERE `teamID` = ?");
   //$stmt->execute(array($teamID));
   try {
      $results = $tinyOrm->select('team_question', array('questionID', 'answer', 'ffScore'), array('teamID' =>$teamID));
   } catch (\Aws\DynamoDb\Exception $e) {
      error_log($e->getMessage . " - " . $e->getCode());
      error_log('DynamoDB error retrieving team_questions for teamID: '.$teamID);
   }
   $answers = array();
   $scores = array();
   //while ($row = $stmt->fetchObject()) {
   foreach($results as $row) {
      if (isset($row['answer'])) {
         $answers[$row['questionID']] = $row['answer'];
      }
      if (isset($row['ffScore'])) {
         $scores[$row['questionID']] = $row['ffScore'];
      }
   }
   $stmt = $db->prepare("SELECT TIME_TO_SEC(TIMEDIFF(NOW(), `team`.`startTime`)) as `timeUsed`, `endTime` FROM `team` WHERE `ID` = ?");
   $stmt->execute(array($teamID));
   $row = $stmt->fetchObject();
   $_SESSION["startTime"] = time() - intval($row->timeUsed);
   if ($row->endTime != null) {
      $_SESSION["closed"] = true;
   }
   echo json_encode((object)array("success" => true, "questionsData" => $questionsData, 'scores' => $scores, "answers" => $answers, "timeUsed" => $row->timeUsed, "endTime" => $row->endTime, "teamPassword" => $_SESSION["teamPassword"]));
}

function closeContest($db) {
   $teamID = $_SESSION["teamID"];
   $stmtUpdate = $db->prepare("UPDATE `team` SET `endTime` = NOW() WHERE `ID` = ? AND `endTime` is NULL");
   $stmtUpdate->execute(array($teamID));
   $_SESSION["closed"] = true;
   $stmt = $db->prepare("SELECT `endTime` FROM `team` WHERE `ID` = ?");
   $stmt->execute(array($teamID));
   $row = $stmt->fetchObject();
   echo json_encode((object)array("success" => true, "endTime" => $row->endTime));   
}

function loadSession() {
   echo json_encode(array(
      "success" => true,
      "teamID" => $_SESSION["teamID"],
      "nbMinutes" => $_SESSION["nbMinutes"],
      "bonusScore" => $_SESSION["bonusScore"],
      "allowTeamsOfTwo" => $_SESSION["allowTeamsOfTwo"],
      "fullFeedback" => $_SESSION["fullFeedback"],
      "contestID" => $_SESSION["contestID"],
      "contestFolder" => $_SESSION["contestFolder"],
      "contestStatus" => $_SESSION["contestStatus"],
      "SID" => session_id()));
   return;
}

function recoverGroup($db) {
   if (!isset($_POST['groupCode']) || !isset($_POST['groupPass'])) {
      echo json_encode((object)array("success" => false, "message" => 'Code ou mot de passe manquant'));
      return;
   }
   $stmt = $db->prepare("SELECT `ID`, `bRecovered`, `contestID`, `expectedStartTime`, `name`, `userID`, `gradeDetail`, `grade`, `schoolID`, `nbStudents`, `nbTeamsEffective`, `nbStudentsEffective`, `noticePrinted`, `isPublic`, `participationType`, `password` FROM `group` WHERE `code` = ?");
   $stmt->execute(array($_POST['groupCode']));
   $row = $stmt->fetchObject();
   if (!$row || $row->password != $_POST['groupPass']) {
      echo json_encode((object)array("success" => false, "message" => 'Mot de passe invalide'));
      return;
   }
   if ($row->bRecovered == 1) {
      echo json_encode((object)array("success" => false, "message" => 'L\'opération n\'est possible qu\'une fois par groupe.'));
      return;
   }
   $stmtUpdate = $db->prepare("UPDATE `group` SET `code` = ?, `password` = ?, `bRecovered`=1 WHERE `ID` = ?;");
   $stmtUpdate->execute(array('#'.$_POST['groupCode'], '#'.$row->password, $row->ID));
   $stmtInsert = $db->prepare("INSERT INTO `group` (`startTime`, `bRecovered`, `contestID`, `expectedStartTime`, `name`, `userID`, `gradeDetail`, `grade`, `schoolID`, `nbStudents`, `nbTeamsEffective`, `nbStudentsEffective`, `noticePrinted`, `isPublic`, `participationType`, `password`, `code`) values (NOW(), 1, :contestID, NOW(), :name, :userID, :gradeDetail, :grade, :schoolID, :nbStudents, 0, 0, 0, :isPublic, :participationType, :password, :code);");
   $stmtInsert->execute(array(
      'contestID' => $row->contestID,
      'name' => ($row->name).'-bis',
      'userID' => $row->userID,
      'gradeDetail' => $row->gradeDetail,
      'grade' => $row->grade,
      'schoolID' => $row->schoolID,
      'nbStudents' => $row->nbStudents,
      'isPublic' => $row->isPublic,
      'participationType' => $row->participationType,
      'password' => $row->password,
      'code' => $_POST['groupCode'],
   ));
   $_SESSION["groupID"] = $db->lastInsertId();
   $_SESSION["startTime"] = time(); // warning: SQL and PHP server must be in sync...
   $_SESSION["closed"] = false;
   $_SESSION["groupClosed"] = false;
   echo json_encode((object)array("success" => true, "startTime" => $_SESSION["startTime"]));   
}

function getRemainingTime($db) {
   if (isset($_SESSION["nbMinutes"]) && isset($_POST['teamID'])) {
      $stmt = $db->prepare("SELECT TIME_TO_SEC(TIMEDIFF(NOW(), `team`.`startTime`)) as `timeUsed` FROM `team` WHERE `ID` = ?");
      $stmt->execute(array($_POST['teamID']));
      $row = $stmt->fetchObject();
      if (!$row) {
         echo json_encode((object)array("success" => false)); 
         return;
      }
      $remainingTime = (60 * $_SESSION["nbMinutes"]) - $row->timeUsed;
      echo json_encode((object)array("success" => true, 'remainingTime' => $remainingTime)); 
   } else {
      echo json_encode((object)array("success" => false));  
   }
}

header("Content-Type: application/json");
header("Connection: close");

initSession();

if (!isset($_POST["action"])) {
   echo json_encode(array("success" => false, "message" => "Aucune action fournie"));
   exit;
}

$action = $_POST["action"];

if ($action === "loadPublicGroups") {
   loadPublicGroups($db);
}

if ($action === "loadSessionOrPublicGroups") {
   if (isset($_SESSION["teamID"]) && (!isset($_SESSION["closed"]))) {
      loadSession($db);
   } else {
      loadPublicGroups($db);
   }
}

else if ($action === "checkPassword") {
   if (!isset($_POST["password"])) {
      echo json_encode(array("success" => false, "message" => "Mot de passe manquant"));
   } else {
      $getTeams = $_POST["getTeams"];
      $password = strtolower($_POST["password"]);
      if (!openGroup($db, $password, $getTeams)) {
         loginTeam($db, $password);
      }
   }
}

else if ($action === "createTeam") {
   if (!isset($_POST["contestants"])) {
      echo json_encode(array("success" => false, "message" => "Informations sur les candidats manquantes"));
   } else if (!isset($_SESSION["groupID"])) {
      echo json_encode(array("success" => false, "message" => "Groupe non chargé"));
   } else {
      createTeam($db, $_POST["contestants"]);
   }
}

else if ($action === "loadContestData") {
   $logged = false;
   if (isset($_SESSION["teamID"])) {
      $logged = true;
   } else {
      if (!isset($_POST["groupPassword"])) {
         echo json_encode(array("success" => false, "message" => "Mot de passe manquant"));
      } else if (!isset($_POST["teamID"])) {
         echo json_encode(array("success" => false, "message" => "Équipe manquante"));
      } else if (!isset($_SESSION["groupID"])) {
         echo json_encode(array("success" => false, "message" => "Groupe non chargé"));
      } else {
         $password = strtolower($_POST["groupPassword"]);
         $logged = reloginTeam($db, $password, $_POST["teamID"]);
      }
   }
   if ($logged) {
      loadContestData($db);
   }
}

else if ($action === "closeContest") {
   if (isset($_SESSION["teamID"]) || reconnectSession($db)) {
      closeContest($db);
   }
}

else if ($action === "getRemainingTime") {
   getRemainingTime($db);
}

else if ($action === 'recoverGroup') {
   recoverGroup($db);
}

unset($db);

?>
