<?php 

$file = "lists.xml";

$xml = simplexml_load_file($file);

echo json_encode($xml);

?>