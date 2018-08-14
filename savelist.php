<?php
$data = $_POST['data'];
$file = "lists.xml";


$xmldoc = new DomDocument( '1.0' );
$xmldoc->preserveWhiteSpace = false;
$xmldoc->formatOutput = true;

if( $xml = file_get_contents($file) ) {
    $xmldoc->loadXML( $xml, LIBXML_NOBLANKS );

    /*if ($data["id"] > 0) { //If the element exists already, delete it and add the new one
		//this gives you a list of the messages
		$list = $xmldoc->getElementsByTagName('list');
		//figure out which one you want -- assign it to a variable (ie: $nodeToRemove )
		$nodeToRemove = null;
		foreach ($list as $domElement){
		  $attrValue = $domElement->getElementsByTagName('id');
		  if ($attrValue->item(0)->firstChild->data == $data['id']) {
		    $nodeToRemove = $domElement; 
		  }
		}

		//Now remove it.
		if ($nodeToRemove != null) {
			$nodeToRemove->parentNode->removeChild($nodeToRemove);
		}

    } else { //Else we make a new element
    	$ids = $xmldoc->getElementsByTagName('id');
    	$id = 0;
    	for($n=$ids->length-1;$n>=0;--$n) {
			$thisid = $ids->item($n)->firstChild->data;//returns 321
			if ($thisid > $id) {
				$id = $thisid;
			}
		}
    	$data["id"] = $id+1;
    }*/

	$list = $xmldoc->getElementsByTagName('list');
	$maxid = 0;
	for ($i = $list->length; --$i >= 0; ) {
		$domElement = $list->item($i);
		$id = $domElement->getElementsByTagName('id')->item(0)->firstChild->data;
		$timestamp = $domElement->getElementsByTagName('timestamp')->item(0)->firstChild->data;
		if ($data["id"] > 0) {
			if ($id == $data['id']) {
				$domElement->parentNode->removeChild($domElement);
			}
		} else {
			if ($id > $maxid) {
				$maxid = $id;
			}
			if ($timestamp < time()-60*60*24 ) {//Remove old lists
				$domElement->parentNode->removeChild($domElement);
			}
		}
	}
	if ($maxid > 0) {
		$data["id"] = $maxid+1;
	}

    $data["timestamp"] = time();

    // find the root tag
    $root = $xmldoc->getElementsByTagName('lists')->item(0);

    // create the <list> tag
    $product = $xmldoc->createElement('list');

    // add the product tag before the first element in the <headercontent> tag
    $root->insertBefore( $product, $root->firstChild );

    foreach ($data as $key => $value) {
    	$element = $xmldoc->createElement($key);
	    $product->appendChild($element);
	    $elementText = $xmldoc->createTextNode($value);
	    $element->appendChild($elementText);
    }

    echo $xmldoc->save($file);
}

?>