<?php 
/* Copyright (c) 2012 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

require_once("../shared/common.php");
use Aws\S3\S3Client;
initSession();

if (!isset($_SESSION["teamID"])) {
   echo json_encode(array('success' => false, 'message' => 'team not logged'));
   exit;
}
if (!isset($_SESSION["closed"])) {
   echo json_encode(array('success' => false, 'message' => 'contest is not over (solutions)!'));
   exit;
}
$teamID = $_SESSION["teamID"];
$query = "SELECT `contest`.`ID`, `contest`.`folder`, `team`.score FROM `team` LEFT JOIN `group` ON (`team`.`groupID` = `group`.`ID`) LEFT JOIN `contest` ON (`group`.`contestID` = `contest`.`ID`) WHERE `team`.`ID` = ?";
$stmt = $db->prepare($query);
$stmt->execute(array($teamID));
if (!($row = $stmt->fetchObject())) {
   echo json_encode(array('success' => false, 'message' => 'contestID inconnu'));
   exit;
}

if ($row->score == null) {
   echo json_encode(array('success' => false, 'message' => 'Afichage de la solution : action impossible'));
   exit;
}

$contestID = $row->ID;
$contestFolder = $row->folder;

$solutions = null;
$solutionsUrl = null;
if ($config->teacherInterface->generationMode == 'local') {
   $solutions = file_get_contents(__DIR__.$config->teacherInterface->sContestGenerationPath.$contestFolder.'/contest_'.$contestID.'_sols.html');
} else {
   require '../ext/autoload.php';
   $publicClient = S3Client::factory(array(
      'key'    => $config->aws->key,
      'secret' => $config->aws->secret,
      'region' => $config->aws->region,
   ));
   $publicBucket = $config->aws->bucketName;
   $solutionsUrl = $publicClient->getObjectUrl($publicBucket, 'contests/'.$contestFolder.'/contest_'.$contestID.'_sols.html', '+10 minutes');
}

echo json_encode(array('success' => true, 'solutions' => $solutions, 'solutionsUrl' => $solutionsUrl));
