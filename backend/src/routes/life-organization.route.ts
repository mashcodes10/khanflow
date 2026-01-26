import { Router } from "express";
import passport from "passport";
import {
  getLifeAreasController,
  createLifeAreaController,
  updateLifeAreaController,
  deleteLifeAreaController,
  createIntentBoardController,
  updateIntentBoardController,
  deleteIntentBoardController,
  createIntentController,
  updateIntentController,
  deleteIntentController,
  getIntentsByBoardController,
  getSuggestionsController,
  acceptSuggestionController,
  snoozeSuggestionController,
  ignoreSuggestionController,
  generateSuggestionsController,
  syncProvidersController,
  getOnboardingQuestionsController,
  completeOnboardingController,
  seedLifeOrganizationController,
  removeExampleIntentsController,
  getOnboardingStatusController,
  resetOnboardingStatusController,
  markOnboardingCompleteController,
  clearLifeOrganizationController,
  getTemplatesController,
} from "../controllers/life-organization.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// Life Areas
router.get("/life-areas", getLifeAreasController);
router.post("/life-areas", createLifeAreaController);
router.put("/life-areas/:id", updateLifeAreaController);
router.delete("/life-areas/:id", deleteLifeAreaController);

// Intent Boards
router.post("/intent-boards", createIntentBoardController);
router.put("/intent-boards/:id", updateIntentBoardController);
router.delete("/intent-boards/:id", deleteIntentBoardController);

// Intents
router.post("/intents", createIntentController);
router.put("/intents/:id", updateIntentController);
router.delete("/intents/:id", deleteIntentController);
router.get("/intent-boards/:id/intents", getIntentsByBoardController);

// Suggestions
router.get("/suggestions", getSuggestionsController);
router.post("/suggestions/generate", generateSuggestionsController);
router.post("/suggestions/:id/accept", acceptSuggestionController);
router.post("/suggestions/:id/snooze", snoozeSuggestionController);
router.post("/suggestions/:id/ignore", ignoreSuggestionController);
router.post("/provider/sync", syncProvidersController);

// Onboarding
router.get("/onboarding/questions", getOnboardingQuestionsController);
router.post("/onboarding/complete", completeOnboardingController);
router.get("/onboarding/status", getOnboardingStatusController);
router.post("/onboarding/mark-complete", markOnboardingCompleteController);
router.post("/onboarding/reset", resetOnboardingStatusController);

// Seeding
router.post("/seed", seedLifeOrganizationController);
router.post("/remove-examples", removeExampleIntentsController);
router.post("/clear", clearLifeOrganizationController);
router.get("/templates", getTemplatesController);

export default router;


