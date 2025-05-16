# lakeworthdigital1

 // Now call the insert method, only if we have a result
    if (ocrResult != null) {
        insertNewProfitAndLossRecord(ocrResult);
    } else {
        System.debug('No OCR result received, not inserting Profit_and_Loss__c record.');
    }
