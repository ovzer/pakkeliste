<?php
$request = $_POST['request'];
$appid = "X457K6-576X6GK4QX";
$xmlurl = "http://api.wolframalpha.com/v2/query?appid=".$appid."&input=".$request."&format=plaintext&assumption=DateOrder_**Month.Day--";

$curl = curl_init();
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL, $xmlurl);
$response = curl_exec($curl);
curl_close($curl);

$xml= simplexml_load_string($response) or die("Error: Cannot create object");


$tempInfo = $xml->pod[1]->subpod->plaintext;
$place = $xml->pod[0]->subpod->plaintext;

$mydata = [$tempInfo, $place];

echo json_encode($mydata);

?>