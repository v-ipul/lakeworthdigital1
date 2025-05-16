# lakeworthdigital1

 // Process the extracted OCR response and map it to target object fields
    private static Map<String, String> processOcrResponse(String extractedValues) {
        Map<String, String> fieldMap = new Map<String, String>();

        // Parse the OCR response to map values to the corresponding fields
        Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(extractedValues);
        List<Object> keyValuePairs = (List<Object>) jsonMap.get('keyValuePair');
        
        // Dynamically process each extracted key-value pair
        for (Object keyValuePair : keyValuePairs) {
            Map<String, Object> keyValueMap = (Map<String, Object>) keyValuePair;
            Map<String, Object> key = (Map<String, Object>) keyValueMap.get('key');
            String keyText = (String) key.get('text');
            String valueText = (String) ((Map<String, Object>) keyValueMap.get('value')).get('text');
            
            // Add the extracted key-value to the field map (use the correct field mappings)
            if (keyText == 'FIRST_NAME') {
                fieldMap.put('Borrower_Name_s__c', valueText); // Map to Borrower_Name_s_c
            } else if (keyText == 'LAST_NAME') {
                fieldMap.put('Name', valueText); // Map to Company_Name
            } else if (keyText == 'LOAN_NUMBER') {
                fieldMap.put('Loan_Number__c', valueText); // Map to Loan_Number__c
            } else if (keyText == 'BUSINESS_TYPE') {
                fieldMap.put('Type_of_Bussiness__c', valueText); // Map to Type_of_Bussiness__c
            }
        }
        return fieldMap;
    }

    // Save the extracted values to the target custom object
    private static void saveExtractedValuesInTargetObject(String objectType, Map<String, String> fieldMap) {
        SObject newRecord = (SObject) Type.forName(objectType).newInstance();
        
        // Set each field dynamically based on the mapped key-value pairs
        for (String field : fieldMap.keySet()) {
            newRecord.put(field, fieldMap.get(field));
        }
        
        // Insert the new record into Salesforce
        insert newRecord;
    }
