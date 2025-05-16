# lakeworthdigital1


            // After OCR processing, introduce a delay before calling the fetchExtractedText method
            Integer delayInMinutes = 5;  // Set delay of 5 minutes before fetching extracted text
            System.debug('Waiting for ' + delayInMinutes + ' minutes before fetching the extracted text.');
            
            // Enqueue another job to fetch the extracted text after the delay
            System.enqueueJob(new FetchExtractedTextWithDelayJob(contentDocumentId, recordId, ocrResult), delayInMinutes);
