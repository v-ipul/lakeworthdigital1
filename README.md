public class IdentificationSaverJob implements Queueable { 
    private String rawJson;
     private Id recordId;
     private String docName;

public IdentificationSaverJob(String rawJson, Id recordId, String docName) {
    this.rawJson  = rawJson;
    this.recordId = recordId;
    this.docName  = docName;
}

public void execute(QueueableContext ctx) {
    // 1) No payload at all
    if (String.isBlank(rawJson)) {
        postToChatter(
            'OCR failed: no data received. Please upload a clear image of your driver’s license.'
        );
        return;
    }

    // 2) Top-level array
    List<Object> wrapperList = (List<Object>) JSON.deserializeUntyped(rawJson);
    if (wrapperList.isEmpty()) {
        postToChatter(
            'OCR failed: empty response. Please upload a valid driver’s license image.'
        );
        return;
    }

    // 3) Drill into the first action’s outputValues
    Map<String, Object> actionResp   = (Map<String, Object>) wrapperList[0];
    Map<String, Object> outputValues = (Map<String, Object>) actionResp.get('outputValues');
    if (outputValues == null
        || !outputValues.containsKey('ocrDocumentScanResultDetails')) {
        postToChatter(
            'OCR failed: no document details found. Please upload a clear driver’s license.'
        );
        return;
    }

    // 4) Get the pages array
    Map<String, Object> detailsWrap = 
        (Map<String, Object>) outputValues.get('ocrDocumentScanResultDetails');
    List<Object> pages = 
        (List<Object>) detailsWrap.get('ocrDocumentScanResultDetails');

    if (pages == null || pages.isEmpty()) {
        postToChatter(
            'OCR failed: could not detect any pages. Please upload a valid driver’s license image.'
        );
        return;
    }

    // 5) Build a new Identification record
    Identification__c idRec = new Identification__c();
    idRec.Application__c   = recordId;

    // 6) Your existing mapping, plus a counter
    Integer mappedCount = 0;
    for (Object pgObj : pages) {
        Map<String, Object> pageMap = (Map<String, Object>) pgObj;
        List<Object> kvps = (List<Object>) pageMap.get('keyValuePairs');
        if (kvps == null) continue;

        for (Object kvpObj : kvps) {
            Map<String, Object> pair     = (Map<String, Object>) kvpObj;
            Map<String, Object> keyMap   = (Map<String, Object>) pair.get('key');
            Map<String, Object> valueMap = (Map<String, Object>) pair.get('value');
            if (keyMap == null || valueMap == null) continue;

            String label = (String) keyMap.get('value');
            String text  = (String) valueMap.get('value');
            if (label == null || text == null) continue;

            String norm = label.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();

            if (norm.contains('4bexp')) {
                idRec.Expiration_Date__c = text;
                mappedCount++;
            } else if (norm.contains('8')) {
                idRec.Address__c = text;
                mappedCount++;
            } else if (norm.contains('15sex')) {
                idRec.Sex__c = text;
                mappedCount++;
            } else if (norm.contains('3dob')) {
                idRec.Date_of_Birth__c = text;
                mappedCount++;
            } else if (norm.contains('4ddln')) {
                idRec.Driving_License_Number__c = text;
                mappedCount++;
            }
            // …add other fields as needed, incrementing mappedCount on each hit…
        }
    }

         List<String> addressLines = new List<String>();
for (Object pgObj : pages) {
    Map<String,Object> pageMap = (Map<String,Object>) pgObj;
    List<Object> kvps = (List<Object>) pageMap.get('keyValuePairs');
    if (kvps == null) continue;
    for (Object kvpObj : kvps) {
        Map<String,Object> pair     = (Map<String,Object>) kvpObj;
        Map<String,Object> keyMap   = (Map<String,Object>) pair.get('key');
        Map<String,Object> valueMap = (Map<String,Object>) pair.get('value');
        if (keyMap == null || valueMap == null) continue;

        String rawKey = ((String) keyMap.get('value')).trim().toLowerCase();
        String val    = (String) valueMap.get('value');
        if (rawKey.equals('8')
         || rawKey.startsWith('8 ')
         || rawKey.contains('apt')) {
            addressLines.add(val);
        }
    }
}
if (!addressLines.isEmpty()) {
    // overwrite or set the address to the joined lines
    idRec.Address__c = String.join(addressLines, ', ');
    mappedCount++;
}


    // 7) If we never pulled back any DL fields, treat as a “bad image”
    if (mappedCount == 0) {
        postToChatter(
            ' OCR failed: no valid driver’s license data detected (' + docName + '). Please upload a valid driver’s license image.'
        );
        return;
    }

    // 8) Finally, insert and catch any DML problems
    try {
        insert idRec;
    } catch (DmlException e) {
        String msg = e.getMessage();
        // truncate so it fits in 10k chars and doesn’t blow up
        if (msg.length() > 200) msg = msg.substring(0, 200) + '…';
        postToChatter(
            'Could not save Identification record: ' + msg
        );
    }
}

/**  
 *  Posts a simple text FeedItem under the LLC_BI_Application__c record’s feed  
 */
private void postToChatter(String body) {
    ConnectApi.ChatterFeeds.postFeedElement(
        /* communityId */ null,
        /* subjectId   */ recordId,
        /* feedType    */ ConnectApi.FeedElementType.FeedItem,
        /* text        */ body
    );
}
}

public class ProfitAndLossSaverJob implements Queueable {

    private String rawJson;
    private String recordId;

    public ProfitAndLossSaverJob(String rawJson, String recordId) {
        this.rawJson = rawJson;
        this.recordId = recordId;
    }

    public void execute(QueueableContext context) {
        if (String.isBlank(rawJson)) {
            System.debug('No JSON payload passed into saver job.');
            return;
        }

        // Top-level array
        List<Object> wrapperList = (List<Object>) JSON.deserializeUntyped(rawJson);
        if (wrapperList.isEmpty()) {
            System.debug('Empty response array.');
            return;
        }

        // Only using the first action response
        Map<String, Object> actionResp = (Map<String, Object>) wrapperList[0];
        Map<String, Object> outputValues = (Map<String, Object>) actionResp.get('outputValues');
        if (outputValues == null || !outputValues.containsKey('ocrDocumentScanResultDetails')) {
            System.debug('No OCR details in outputValues.');
            return;
        }

        // Drill into the nested details wrapper
        Map<String, Object> detailsWrap = 
            (Map<String, Object>) outputValues.get('ocrDocumentScanResultDetails');
        List<Object> pages = 
            (List<Object>) detailsWrap.get('ocrDocumentScanResultDetails');
        if (pages == null || pages.isEmpty()) {
            System.debug('No pages returned.');
            return;
        }

        // Build a single Profit_and_Loss__c record
        Profit_and_Loss__c pl = new Profit_and_Loss__c();

        // Iterate each page
        for (Object pgObj : pages) {
            Map<String, Object> pageMap = (Map<String, Object>) pgObj;
            List<Object> kvps = (List<Object>) pageMap.get('keyValuePairs');
            if (kvps == null) continue;

            // Iterate each key/value pair
            for (Object kvpObj : kvps) {
                Map<String, Object> pair    = (Map<String, Object>) kvpObj;
                Map<String, Object> keyMap   = (Map<String, Object>) pair.get('key');
                Map<String, Object> valueMap = (Map<String, Object>) pair.get('value');
                if (keyMap == null || valueMap == null) continue;

                String label = (String) keyMap.get('value');
                String text  = (String) valueMap.get('value');
                if (label == null || text == null) continue;

                String norm = label.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();

                // YOUR MAPPING LOGIC
                if (norm.contains('borrowernames')) {
                    pl.Borrower_Name_s__c = text;
                } else if (norm.contains('companyname')) {
                    pl.Name = text;
                } else if (norm.contains('typeofbusiness')) {
                    pl.Type_of_Bussiness__c = text;
                } else if (norm.contains('loannumber')) {
                    pl.Loan_Number__c = text;
                }
		
    }
                
            
        }

        pl.Application__c = recordId;

        // Insert the record
        try {
            insert pl;
            System.debug('Inserted Profit_and_Loss__c record with Id: ' + pl.Id);
        } catch (DmlException e) {
            System.debug('Failed to insert Profit_and_Loss__c: ' + e.getMessage());
        }
    }
}


{"actionName":"fetchExtractedText","errors":null,"invocationId":null,"isSuccess":true,"outcome":null,"outputValues":{"ocrDocumentScanResultDetails":{"ocrDocumentScanResultDetails":[{"status":"SUCCESS","pageNumber":1,"ocrService":"AMAZON_TEXTRACT","ocrDocumentScanResultId":"0ixEi0000000F8j","keyValuePairs":[{"value":{"value":"01/07/2022","confidence":95.41329956054688},"key":{"value":"4a ISS:","confidence":95.41329956054688}},{"value":{"value":"M","confidence":90.11119842529297},"key":{"value":"15 SEX:","confidence":90.11119842529297}},{"value":{"value":"01/08/2029","confidence":95.17903137207031},"key":{"value":"4b EXP:","confidence":95.17903137207031}},{"value":{"value":"C","confidence":95.06723022460938},"key":{"value":"9 CLASS:","confidence":95.06723022460938}},{"value":{"value":"1234567890123","confidence":79.84049224853516},"key":{"value":"5 DD:","confidence":79.84049224853516}},{"value":{"value":"00","confidence":94.99248504638672},"key":{"value":"DUPS:","confidence":94.99248504638672}},{"value":{"value":"NONE","confidence":95.02444458007812},"key":{"value":"9a END:","confidence":95.02444458007812}},{"value":{"value":"99 999 999","confidence":95.25765991210938},"key":{"value":"4d DLN:","confidence":95.25765991210938}},{"value":{"value":"01/07/1973","confidence":99.19088745117188},"key":{"value":"3 DOB:","confidence":99.19088745117188}},{"value":{"value":"5'-11\"","confidence":95.27406311035156},"key":{"value":"16 HGT:","confidence":95.27406311035156}},{"value":{"value":"1","confidence":51.69779586791992},"key":{"value":"APT.","confidence":51.69779586791992}},{"value":{"value":"NONE","confidence":93.73870086669922},"key":{"value":"12 RESTR:","confidence":93.73870086669922}},{"value":{"value":"BRO","confidence":90.3697509765625},"key":{"value":"18 EYES:","confidence":90.3697509765625}}]}]}},"sortOrder":-1,"version":1}

public class FetchExtractedTextWithDelayJob implements Queueable, Database.AllowsCallouts { 

    private String ocrDocumentScanResultId;
    private String contentDocumentId;

    // Constructor to pass the parameters to the queueable job
    public fetchExtractedTextWithDelayJob(String ocrDocumentScanResultId, String contentDocumentId) {
        this.ocrDocumentScanResultId = ocrDocumentScanResultId;
        this.contentDocumentId = contentDocumentId;
    }

    // Implement the execute method
    public void execute(QueueableContext context) {
        // Call the fetchExtractedText method inside the execute method
        fetchExtractedText(ocrDocumentScanResultId, contentDocumentId);
          String detailsString = JSON.serialize(fetchExtractedText(ocrDocumentScanResultId, contentDocumentId)); 
        System.enqueueJob(new ProfitAndLossSaverJob(detailsString));
    }

    // This method fetches the extracted text using the fetchExtractedText API
private String fetchExtractedText(String ocrDocumentScanResultId, String contentDocumentId) {
    Http http = new Http();
    HttpRequest request = new HttpRequest();

    // Salesforce REST API endpoint to fetch extracted text using the OCR result ID
    String endpointUrl = '/services/data/v58.0/actions/standard/fetchExtractedText';

    // Prepare the request body as a JSON string
    String requestBody = JSON.serialize(new Map<String, Object>{
        'inputs' => new List<Map<String, Object>>{
            new Map<String, Object>{
                'ocrDocumentScanResultId' => ocrDocumentScanResultId,  // OCR result ID obtained from the first step
                'contentDocumentId' => contentDocumentId,  // Ensure you pass the contentDocumentId as well
                'startPageIndex' => 1,  // Start from page 1
                'endPageIndex' => 20   // You can change the number of pages to extract
            }
        }
    });

    // Set up the HTTP request
    request.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + endpointUrl);  // Combine Salesforce base URL with the endpoint
    request.setMethod('POST');
    request.setHeader('Content-Type', 'application/json');
    request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());  // Use the session ID for authorization
    request.setBody(requestBody);

    // Send the HTTP request
    HttpResponse response = http.send(request);

    // Log the response for debugging
    System.debug('Extracted Text API response: ' + response.getBody());

    // Handle the response
    if (response.getStatusCode() == 200) {
        // Deserialize the response body into a List<Object> (as per your requirement)
        List<Object> responseList = (List<Object>) JSON.deserializeUntyped(response.getBody());

        // Check if the response list is not empty
        if (responseList != null && !responseList.isEmpty()) {
            // Get the first item in the response list
            Map<String, Object> firstResult = (Map<String, Object>) responseList.get(0);

            // Check if 'outputValues' key exists and contains 'ocrDocumentScanResultDetails'
            if (firstResult.containsKey('outputValues')) {
                Map<String, Object> outputValues = (Map<String, Object>) firstResult.get('outputValues');
                if (outputValues.containsKey('ocrDocumentScanResultDetails')) {
                    // Change: Deserialize the 'ocrDocumentScanResultDetails' as a List<Object> instead of List<Map<String, Object>>
                    Map<String, Object> detailsList = (Map<String, Object>) outputValues.get('ocrDocumentScanResultDetails');

                    System.debug('Extracted Text: ' + detailsList);
                    return detailsList.toString(); // Returning the extracted text (you can further process it if needed)
                }
            }
            System.debug('No OCR document scan result details found.');
            return null;
        } else {
            System.debug('No extracted text found.');
            return null;
        }
    } else {
        System.debug('Error calling Extracted Text API, status: ' + response.getStatus() + ', body: ' + response.getBody());
        return null;
    }
}
}
