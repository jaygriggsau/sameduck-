export const MESSAGES = {
  common: {
    requestBodyInvalid: "Request body is invalid.",
    requestFailed: "Request failed.",
    serverConfigIncomplete: "Server configuration is incomplete.",
    authenticationRequired: "Authentication required.",
    permissionDenied: "Permission denied.",
    jobNotFound: "Job not found.",
  },
  auth: {
    verificationCodeInvalidOrExpired: "Verification code is invalid or expired.",
    tooManyVerificationAttempts: "Too many verification attempts. Request a new code.",
    couldNotSendVerificationCode: "Could not send verification code.",
    couldNotVerifyCode: "Could not verify code.",
    emailProviderCouldNotSendVerificationCode: "Email provider could not send the verification code.",
  },
  jobs: {
    invalidGarmentImagePayload: "Uploaded garment image is not a valid image data payload.",
    couldNotCreateGenerationJob: "Could not create generation job.",
    generationJobMissingId: "Generation job was created without a job id.",
    couldNotLoadJobDetails: "Could not load job details.",
    invalidJobResponseFormat: "Job response format is invalid.",
    couldNotDeleteJob: "Could not delete this job.",
    noOutputImages:
      "Model returned no output images. Try a clearer garment image or a more specific model/photoshoot prompt.",
    webhookNoOutputImages: "Image generation completed but returned no output images.",
    imageGenerationFailed: "Image generation failed.",
    imageGenerationRequestFailed: "Image generation request failed.",
    blobStorageNotConfigured:
      "Image storage is not configured. Add Vercel Blob to this project and set BLOB_READ_WRITE_TOKEN.",
    couldNotFetchOutputForStorage:
      "Could not copy a generated image into permanent storage. Try generating again.",
  },
  folders: {
    folderNameRequired: "Folder name is required.",
    folderNameTooLong: "Folder name must be 60 characters or fewer.",
    couldNotCreateFolder: "Could not create folder.",
  },
  credits: {
    insufficientCredits: "You don't have enough credits. Purchase a pack or subscribe to continue.",
    couldNotLoadBalance: "Could not load credit balance.",
    checkoutFailed: "Could not start checkout. Please try again.",
  },
  webhook: {
    invalidPayload: "Webhook payload is invalid.",
  },
  uploads: {
    invalidImageFile: "Selected file is not a valid image.",
    browserCouldNotProcessImage: "Browser could not process the selected image.",
  },
} as const;

