<?php
/* Copyright (c) 2012 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

$tablesModels = array (
   "contestant" => array(
      "autoincrementID" => false,
      "fields" => array(
         "firstName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "lastName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "genre" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "teamID" => array("type" => "int"),
         "cached_schoolID" => array("type" => "int"),
         "rank" => array("type" => "int"),
         "schoolRank" => array("type" => "int"),
         "algoreaCode" => array("type" => "string"),
         "saniValid" => array("type" => "int", "access" => array("write" => array("generator", "admin"), "read" => array("admin"))),
         "orig_firstName" => array("type" => "string"),
         "orig_lastName" => array("type" => "string")
      ),
      "hasHistory" => false
   ),
   "contest" => array(
      "autoincrementID" => false,
      "fields" => array(
         "name" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "level" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "year" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "status" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "nbMinutes" =>  array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "bonusScore" =>  array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "allowTeamsOfTwo" =>  array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "fullFeedback" =>  array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "nextQuestionAuto" =>  array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "folder" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "minAward1Rank" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "minAward2Rank" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin")))
      )
   ),
   "contest_question" => array(
      "autoincrementID" => false,
      "fields" => array(
         "contestID" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "questionID" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "minScore" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "noAnswerScore" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "maxScore" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "options" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "order" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
      )
   ),
   "group" => array(
      "autoincrementID" => false,
      "fields" => array(
         "schoolID" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "grade" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "gradeDetail" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "userID" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "name" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "nbStudents" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "nbTeamsEffective" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "nbStudentsEffective" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "contestID" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "code" =>  array("type" => "string", "access" => array("write" => array("generator", "admin"), "read" => array("admin"))),
         "password" => array("type" => "string", "access" => array("write" => array("generator", "admin"), "read" => array("admin"))),
         "expectedStartTime" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "startTime" => array("type" => "date"),
         "noticePrinted" => array("type" => "int"),
         "isPublic" => array("type" => "int"),
         "participationType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      )
   ),
   "question" => array(
      "autoincrementID" => false,
      "fields" => array(
         "key" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "folder" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "name" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "answerType" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "expectedAnswer" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin")))
      )
   ),
   "school" => array(
      "autoincrementID" => false,
      "fields" => array(
         "userID" => array("type" => "int", "access" => array("write" => array("generator", "admin", "user"), "read" => array("admin"))),
         "name" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "region" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "address" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "zipcode" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "city" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "country" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "coords" => array("type" => "string", "access" => array("write" => array("generator", "admin", "user"), "read" => array("admin"))),
         "nbStudents" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "validated" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "saniValid" => array("type" => "int", "access" => array("write" => array("generator", "admin", "user"), "read" => array("admin"))),
         "saniMsg" => array("type" => "string", "access" => array("write" => array("generator", "admin", "user"), "read" => array("user"))),
         "orig_name" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "orig_city" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "orig_country" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      )
   ),
   "school_user" => array(
      "autoincrementID" => false,
      "fields" => array(
         "userID" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "schoolID" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "confirmed" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "awardsReceivedYear" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")))
      )
   ),
   "school_year" => array(
      "autoincrementID" => false,
      "fields" => array(
         "schoolID" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "year" => array("type" => "int"),
         "nbOfficialContestants" => array("type" => "int"),
         "awarded" => array("type" => "int")
      )
   ),
   "team" => array(
      "autoincrementID" => false,
      "fields" => array(
         "groupID" => array("type" => "int"),
         "password" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "startTime" => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "endTime" => array("type" => "date"),
         "score" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "participationType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      ),
      "hasHistory" => false
   ),
   "team_question" => array(
      "autoincrementID" => false,
      "primaryKey" => false,
      "fields" => array(
         "teamID" => array("type" => "int"),
         "questionID" => array("type" => "int"),
         "answer" => array("type" => "string"),
         "score" => array("type" => "int"),
         "ffScore" => array("type" => "int"),
         "date" => array("type" => "date")
      ),
      "hasHistory" => false
   ),
   "user" => array(
      "autoincrementID" => false,
      "fields" => array(
         "firstName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "lastName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "officialEmail" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "officialEmailValidated" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "alternativeEmail" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "alternativeEmailValidated" => array("type" => "string", "access" => array("write" => array("generator", "admin"), "read" => array("admin"))),
         "salt" => array("type" => "string", "access" => array("write" => array("generator"), "read" => array("admin"))),
         "passwordMd5" => array("type" => "string", "access" => array("write" => array("generator"), "read" => array("admin"))),
         "recoverCode" => array("type" => "string"),
         "validated" => array("type" => "string", "access" => array("write" => array("generator", "admin"), "read" => array("admin"))),
         "allowMultipleSchools" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "isAdmin" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "registrationDate" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "lastLoginDate" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "awardPrintingDate" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "comment" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "gender" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "saniValid" => array("type" => "int", "access" => array("write" => array("generator", "user"), "read" => array("admin"))),
         "orig_firstName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "orig_lastName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      )
    ),
    "languages" => array(
        "fields" => array(
            "name" => array(
                "type" => "string",
                "access" => array("write" => array("admin"), "read" => array("admin"))),
            "suffix" => array(
                "type" => "string",
                "access" => array("write" => array("admin"), "read" => array("admin"))),
        )
   ),
    "user_user" => array(
        "autoincrementID" => false,
        "fields" => array(
            "userID" => array(
                "type" => "int",
                "access" => array("write" => array("user"), "read" => array("user"))),
            "targetUserID" => array(
                "type" => "int",
                "access" => array("write" => array("user"), "read" => array("user"))),
            "accessType" => array(
                "type" => "string",
                "access" => array("write" => array("user"), "read" => array("user"))),
        )
   ),
);

if (isset($_SESSION["isAdmin"]) && $_SESSION["isAdmin"]) {
   $fieldGroup = array("tableName" => "group", "fieldName" => "name");
   $fieldGroupFilter = array("joins" => array("group"), "condition" => "`[PREFIX]group`.`name` LIKE :groupField");
} else {
   $fieldGroup = array("tableName" => "team", "fieldName" => "groupID", "access" => array("write" => array(), "read" => array("user")));
   $fieldGroupFilter = array("joins" => array("team"), "condition" => "`[PREFIX]team`.`groupID` = :groupField");
}

$viewsModels = array(
   'award1' => array(
      'mainTable' => 'contestant',
      'adminOnly' => false,
      'joins'     => array(
         "team" => array("srcTable" => "contestant", "srcField" => "teamID", "dstField" => "ID"),
         "group" => array("srcTable" => "team", "srcField" => "groupID", "dstField" => "ID"),
         "contest" => array("srcTable" => "group", "srcField" => "contestID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
         "school" => array("srcTable" => "group", "srcField" => "schoolID", "dstField" => "ID")
      ),
      'fields' => array(
         "schoolID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "contestID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "groupField" => $fieldGroup,
         "firstName" => array(),
         "lastName" => array(),
         "genre" => array(),
         "score" => array("tableName" => "team"),
         "rank" => array(),
         "country" => array("tableName" => "school"),
         "city" => array("tableName" => "school"),
         "name" => array("tableName" => "school"),
         "algoreaCode" => array()
      ),
      "filters" => array(
         "groupField" => $fieldGroupFilter,
         "score" => array("joins" => array("team"), "condition" => "`[PREFIX]team`.`score` = :[PREFIX_FIELD]score"),
         "schoolID" => array("joins" => array(), "condition" => "`[PREFIX]contestant`.`cached_schoolID` = :[PREFIX_FIELD]schoolID"),
         "contestID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`contestID` = :[PREFIX_FIELD]contestID"),
         "userID" => array("joins" => array("user_user"), "condition" => "(`group`.`userID` = :[PREFIX_FIELD]userID OR (`[PREFIX]user_user`.`targetUserID` = :[PREFIX_FIELD]userID AND `[PREFIX]user_user`.`accessType` <> 'none'))"),
         "ownerUserID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`userID` = :[PREFIX_FIELD]ownerUserID"),
         "awarded" => array("joins" => array("contest", 'team'), "ignoreValue" => true, "condition" => "(`[PREFIX]team`.`participationType` = 'Official' and `[PREFIX]contestant`.`rank` is not null and `[PREFIX]contest`.`minAward1Rank` is not null and `[PREFIX]contestant`.`rank` <= `[PREFIX]contest`.`minAward1Rank`)"),
      ),
      'orders' => array(
         array('field' => 'name'),
         array('field' => 'contestID'),
         array('field' => 'groupField'),
         array('field' => 'rank'),
         array('field' => 'lastName'),
         array('field' => 'firstName'),
      )
   ),
   
   'award2' => array(
      'mainTable' => 'contestant',
      'adminOnly' => false,
      'joins'     => array(
         "team" => array("srcTable" => "contestant", "srcField" => "teamID", "dstField" => "ID"),
         "group" => array("srcTable" => "team", "srcField" => "groupID", "dstField" => "ID"),
         "contest" => array("srcTable" => "group", "srcField" => "contestID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
         "school" => array("srcTable" => "group", "srcField" => "schoolID", "dstField" => "ID")
      ),
      'fields' => array(
         "schoolID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "contestID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "groupField" => $fieldGroup,
         "firstName" => array(),
         "lastName" => array(),
         "genre" => array(),
         "score" => array("tableName" => "team"),
         "rank" => array(),
         "country" => array("tableName" => "school"),
         "city" => array("tableName" => "school"),
         "name" => array("tableName" => "school")
      ),
      "filters" => array(
         "groupField" => $fieldGroupFilter,
         "score" => array("joins" => array("team"), "condition" => "`[PREFIX]team`.`score` = :[PREFIX_FIELD]score"),
         "schoolID" => array("joins" => array(), "condition" => "`[PREFIX]contestant`.`cached_schoolID` = :[PREFIX_FIELD]schoolID"),
         "userID" => array("joins" => array("user_user"), "condition" => "(`group`.`userID` = :[PREFIX_FIELD]userID OR (`[PREFIX]user_user`.`targetUserID` = :[PREFIX_FIELD]userID AND `[PREFIX]user_user`.`accessType` <> 'none'))"),
         "ownerUserID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`userID` = :[PREFIX_FIELD]ownerUserID"),
         "awarded" => array("joins" => array("contest", "team"), "ignoreValue" => true, "condition" => "(`[PREFIX]team`.`participationType` = 'Official' and `[PREFIX]contestant`.`rank` is not null and `[PREFIX]contest`.`minAward2Rank` is not null and `[PREFIX]contestant`.`rank` <= `[PREFIX]contest`.`minAward2Rank`)"),
      ),
      'orders' => array(
         array('field' => 'name'),
         array('field' => 'contestID'),
         array('field' => 'groupField'),
         array('field' => 'rank'),
         array('field' => 'lastName'),
         array('field' => 'firstName'),
      )
   ),
   
   "contestant" => array(
      "mainTable" => "contestant",
      "adminOnly" => false,
      "joins" => array(
         "team" => array("srcTable" => "contestant", "srcField" => "teamID", "dstField" => "ID"),
         "group" => array("srcTable" => "team", "srcField" => "groupID", "dstField" => "ID"),
         "contest" => array("srcTable" => "group", "srcField" => "contestID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
      ),
      "fields" => array(
         "schoolID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "contestID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "groupField" => $fieldGroup,
         "saniValid" => array(),
         "firstName" => array(),
         "lastName" => array(),
         "genre" => array(),
         "score" => array("tableName" => "team"),
         "rank" => array(),
         "level" => array("tableName" => "contest"),
      ),
      "filters" => array(
         "groupField" => $fieldGroupFilter,
         "score" => array("joins" => array("team"), "condition" => "`[PREFIX]team`.`score` = :score"),
         "schoolID" => array("joins" => array(), "condition" => "`[PREFIX]contestant`.`cached_schoolID` = :schoolID"),
         "userID" => array("joins" => array("user_user"), "condition" => "(`group`.`userID` = :userID OR (`[PREFIX]user_user`.`targetUserID` = :userID AND `[PREFIX]user_user`.`accessType` <> 'none'))"),
         "ownerUserID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`userID` = :[PREFIX_FIELD]ownerUserID"),
      ),
   ),
   
   "contestantCSV" => array(
      "mainTable" => "contestant",
      "adminOnly" => false,
      "joins" => array(
         "team" => array("srcTable" => "contestant", "srcField" => "teamID", "dstField" => "ID"),
         "group" => array("srcTable" => "team", "srcField" => "groupID", "dstField" => "ID"),
         "contest" => array("srcTable" => "group", "srcField" => "contestID", "dstField" => "ID"),
         "school" => array("srcTable" => "group", "srcField" => "schoolID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
      ),
      "fields" => array(
         "schoolID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "schoolName" => array("tableName" => "school", "fieldName" => "name"),
         "grade" => array("tableName" => "group"),
         "contestID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "contestName" => array("tableName" => "contest", "fieldName" => "name"),
         "groupName" => array("tableName" => "group", "fieldName" => "name"),
         "saniValid" => array(),
         "firstName" => array(),
         "lastName" => array(),
         "genre" => array(),
         "score" => array("tableName" => "team"),
         "rank" => array(),
         "algoreaCode" => array()
      ),
      "filters" => array(
         "groupField" => $fieldGroupFilter,
         "score" => array("joins" => array("team"), "condition" => "`[PREFIX]team`.`score` = :score"),
         "schoolID" => array("joins" => array(), "condition" => "`[PREFIX]contestant`.`cached_schoolID` = :schoolID"),
         "userID" => array("joins" => array("user_user"), "condition" => "(`group`.`userID` = :userID OR (`[PREFIX]user_user`.`targetUserID` = :userID AND `[PREFIX]user_user`.`accessType` <> 'none'))"),
         "ownerUserID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`userID` = :[PREFIX_FIELD]ownerUserID"),
      ),
   ),
   
   "team_view" => array(
      "mainTable" => "team",
      "adminOnly" => false,
      "joins" => array(
         "group" => array("srcTable" => "team", "srcField" => "groupID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
         "contestant" => array("srcTable" => "team", "srcField" => "ID", "dstField" => "teamID")
      ),
      "fields" => array(
         "schoolID" => array("tableName" => "group", "access" => array("write" => array(), "read" => array("user"))),
         "name" => array("tableName" => "group"),
         "contestants" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin")), "tableName" => "contestant", "sql" => "group_concat(`contestant`.`lastName`,' ',`contestant`.`firstName` separator ',')", "groupBy" => "`team`.`ID`"),
         "password" => array(),
         "startTime" => array(),
         "score" => array(),
         "participationType" => array()
      ),
      "filters" => array(
         "schoolID" => array("joins" => array("group"), "condition" => "`[PREFIX]group`.`schoolID` = :schoolID"),
         "userID" => array("joins" => array("user_user"), "condition" => "(`group`.`userID` = :userID OR (`[PREFIX]user_user`.`targetUserID` = :userID AND `[PREFIX]user_user`.`accessType` <> 'none'))"),
         "contestants" => array(
            "joins" => array("contestant"),
            "condition" => "concat(`[PREFIX]contestant`.`firstName`,' ',`[PREFIX]contestant`.`lastName`) LIKE :contestants")
      )
   ),
   "group" => array(
      "mainTable" => "group",
      "adminOnly" => false,
      "joins" => array(
         "school" => array("srcTable" => "group", "srcField" => "schoolID", "dstField" => "ID"),
         "contest" => array("srcTable" => "group", "srcField" => "contestID", "dstField" => "ID"),
         "user_user" => array("type" => "LEFT", "srcTable" => "group", "srcField" => "userID", "dstField" => "userID"),
         "school_user" => array("srcTable" => "group", "srcField" => "schoolID", "dstField" => "schoolID"),
         "user" => array("srcTable" => "group", "srcField" => "userID", "dstField" => "ID")
      ),
      "fields" => array(
         "schoolID" => array(),
         "userLastName"  => array("fieldName" => "lastName", "tableName" => "user"),
         "userFirstName"  => array("fieldName" => "firstName", "tableName" => "user"),
         "contestID" => array(),
         "grade" => array(),
         "participationType" => array(),
         "expectedStartTime" => array(),
         "name" => array(),
         "code" =>  array(),
         "password" => array(),
         "nbTeamsEffective" => array(),
         "nbStudentsEffective" => array(),
         "nbStudents" => array(),
         "userID" => array("fieldName" => "userID", "tableName" => "group")
//         "accessUserID" => array("fieldName" => "targetUserID", "tableName" => "user_user")
      ),
      "filters" => array(
         "statusNotHidden" => array(
            "joins" => array("contest"),
            "condition" => "(`[PREFIX]contest`.`status` <> 'Hidden')",
            "ignoreValue" => true
         ),
         "checkOfficial" => array(
            "joins" => array("contest"),
            "condition" => "((`[PREFIX]contest`.`status` = 'FutureContest') OR ".
                            "(`[PREFIX]contest`.`status` = 'RunningContest') OR ".
                            "(`[PREFIX]contest`.`status` = 'PreRanking') OR ".
                            "(`[PREFIX]group`.`participationType` = 'Unofficial'))",
            "ignoreValue" => true
         ),
         "checkSchoolUserID"  => array(
            "joins" => array("school_user"),
            "condition" => "(`[PREFIX]school_user`.`userID` = :[PREFIX_FIELD]checkSchoolUserID)"
         ),
         "checkAccessUserID" => array(
            "joins" => array("user_user"),
            "condition" => "((`[PREFIX]user_user`.`accessType` <> 'none' AND `[PREFIX]user_user`.`targetUserID` = :[PREFIX_FIELD]checkAccessUserID) ".
                           "OR (`[PREFIX]group`.`userID` = :[PREFIX_FIELD]checkAccessUserID))"
         )
      )
   ),
   "contest_question" => array(
      "mainTable" => "contest_question",
      "adminOnly" => true,
      "joins" => array(
      ),
      "fields" => array(
         "contestID" => array(),
         "questionID" => array(),
         "minScore" => array(),
         "noAnswerScore" => array(),
         "maxScore" => array(),
         "options" => array(),
         "order" => array()
      ),
      "filters" => array(
      )
   ),
   "school_search" => array(
      "mainTable" => "school",
      "adminOnly" => false,
      "joins" => array(),
      "fields" => array(
         "name" => array(),
         "region" => array(),
         "address" => array(),
         "city" => array(),
         "zipcode" => array(),
         "country" => array()
      )
   ),
   "school_user" => array(
      "mainTable" => "school_user",
      "adminOnly" => false,
      "joins" => array(),
      "fields" => array(
         "userID" => array(),
         "schoolID" => array(),
         "confirmed" => array(),
         "awardsReceivedYear" => array()
      )
   ),
   "school_year" => array(
      "mainTable" => "school_year",
      "adminOnly" => false,
      "joins" => array(
         "school_user" => array("srcTable" => "school_year", "srcField" => "schoolID", "dstField" => "schoolID")
      ),
      "fields" => array(
         "schoolID" => array(),
         "userID" => array("tableName"  => "school_user"),
         "year" => array(),
         "nbOfficialContestants" => array(),
         "awarded" => array()
      )
   ),
   "school" => array(
      "mainTable" => "school",
      "adminOnly" => false,
      "joins" => array(
         "user" => array("srcTable" => "school", "srcField" => "userID", "dstField" => "ID"),
         "school_user" => array("srcTable" => "school", "srcField" => "ID", "dstField" => "schoolID"),
         "school_user_count" => array("srcTable" => "school", "srcField" => "ID", "dstTable" => "school_user", "dstField" => "schoolID", "type" => "LEFT")
      ),
      "fields" => array(
         "name" => array(),
         "region" => array(),
         "address" => array(),
         "city" => array(),
         "zipcode" => array(),
         "country" => array(),
         "nbStudents" => array(),
         "userLastName" => array("tableName" => "user", "fieldName" => "lastName"),
         "userFirstName" => array("tableName" => "user", "fieldName" => "firstName"),
         "saniValid" => array(),
         "saniMsg" => array(),
         "coords" => array(),
         "userID" => array(),
         "ownerFirstName"  => array("fieldName" => "firstName", "tableName" => "user"),
         "ownerLastName"  => array("fieldName" => "lastName", "tableName" => "user"),
         "nbUsers" => array(
            "tableName" => "school_user_count",
            "type" => "int",
            "sql" => "count(*)",
            "groupBy" => "`school`.`ID`",
            "access" => array("write" => array(), "read" => array("user"))
         )
      ),
      "filters" => array(
         "accessUserID" => array(
            "joins" => array("school_user"),
            "condition" => "(`[PREFIX]school_user`.`userID` = :[PREFIX_FIELD]accessUserID)"
         )
      )
   ),
   "contest" => array(
      "mainTable" => "contest",
      "adminOnly" => true,
      "joins" => array(),
      "fields" => array(
         "name" => array(),
         "level" => array(),
         "year" => array(),
         "status" => array(),
         "nbMinutes" =>  array(),
         "bonusScore" =>  array(),
         "allowTeamsOfTwo" =>  array(),
         "fullFeedback" =>  array(),
         "nextQuestionAuto" =>  array(),
         "folder" => array(),
         "minAward1Rank" => array(),
         "minAward2Rank" => array()
      ),
      "filters" => array(
         "statusNotHidden" => array(
            "joins" => array(),
            "condition" => "(`[PREFIX]contest`.`status` <> 'Hidden')",
            "ignoreValue" => true
          )
      )
   ),
   "question" => array(
      "mainTable" => "question",
      "adminOnly" => true,
      "joins" => array(
      ),
      "fields" => array(
         "key" => array(),
         "folder" => array(),
         "name" => array(),
         "answerType" => array(),
         "expectedAnswer" => array()
      ),
      "filters" => array(
      )
   ),
   "user" => array(
      "mainTable" => "user",
      "adminOnly" => true,
      "joins" => array(
      ),
      "fields" => array(
         "saniValid" => array(),
         "gender" => array(),
         "lastName" => array(),
         "firstName" => array(),
         "officialEmail" => array(),
         "officialEmailValidated" => array(),
         "alternativeEmail" => array(),
         "validated" => array(),
         "allowMultipleSchools" => array(),
         "registrationDate" => array(),
         "lastLoginDate" => array(),
         "awardPrintingDate" => array(),
         "isAdmin" => array(),
         "comment" => array(),
         "passwordMd5" => array(),
         "salt" => array()
      ),
      "filters" => array(
      )
   ),
   "languages" => array(
       "mainTable" => "languages",
       "adminOnly" => true,
       "joins" => array(),
       "fields" => array(
           "name" => array(),
           "suffix" => array()
       ),
       "filters" => array()
   ),
   "translations" => array(
       "mainTable" => "translations",
       "adminOnly" => true,
       "joins" => array(),
       "fields" => array(
           "languageID" => array(),
           "category" => array(),
           "key" => array(),
           "translation" => array()
       ),
       "filters" => array()
   ),
   "colleagues" => array(
      "mainTable" => "user",
      "adminOnly" => false,
      "joins" => array(
         "user_user_target" => array("type" => "LEFT", "srcTable" => "user", "srcField" => "ID", "dstTable" => "user_user", "dstField" => "targetUserID"),
         "user_user_source" => array("type" => "LEFT", "srcTable" => "user", "srcField" => "ID", "dstTable" => "user_user", "dstField" => "userID"),
         "school_user" => array("srcTable" => "user", "srcField" => "ID", "dstField" => "userID"),
         "school" => array("srcTable" => "school_user", "srcField" => "schoolID", "dstField" => "ID"),
         "school_user_self" => array("srcTable" => "school", "srcField" => "ID", "dstTable" => "school_user", "dstField" => "schoolID")
      ),
      "fields" => array(
         "lastName" => array(
            "tableName" => "user",
            "access" => array("write" => array(), "read" => array())
         ),
         "firstName" => array(
            "tableName" => "user",
            "access" => array("write" => array(), "read" => array())
         ),
         "accessTypeGiven" => array(
            "type" => "string",
            "tableName" => "user_user_target",
            "fieldName" => "accessType",
            "access" => array("write" => array("admin", "user"), "read" => array("admin", "user"))
         ),
         "accessTypeReceived" => array(
            "type" => "string",
            "tableName" => "user_user_source",
            "fieldName" => "accessType",
            "access" => array("write" => array("admin"), "read" => array("admin", "user"))
         )
      ),
      "filters" => array(
         "userID" => array(
            "joins" => array("school_user", "school_user_self", "user_user_target", "user_user_source"),
            "condition" => "(`[PREFIX]school_user`.`schoolID` = `[PREFIX]school_user_self`.`schoolID` AND ".
                           "(`[PREFIX]user`.`ID` <> :[PREFIX_FIELD]userID) AND ".
                           "(`[PREFIX]school_user_self`.`userID` = :[PREFIX_FIELD]userID) AND ".
                           "((`[PREFIX]user_user_target`.`userID` = :[PREFIX_FIELD]userID) OR (`[PREFIX]user_user_target`.`userID` IS NULL)) AND ".
                           "((`[PREFIX]user_user_source`.`targetUserID` = :[PREFIX_FIELD]userID) OR (`[PREFIX]user_user_source`.`targetUserID` IS NULL)))"
         ),
      )
   ),   
);

?>
