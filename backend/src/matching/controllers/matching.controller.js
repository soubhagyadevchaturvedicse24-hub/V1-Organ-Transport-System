import * as matchingService from '../services/matching.service.js';

export const runMatching = async (req, res, next) => {
  try {
    const match = await matchingService.runMatching(req.params.organId, req.user.sub);
    res.status(200).json(match);
  } catch (error) {
    next(error);
  }
};

export const getMatch = async (req, res, next) => {
  try {
    const match = await matchingService.getMatchByOrganId(req.params.organId);
    res.status(200).json(match);
  } catch (error) {
    next(error);
  }
};

export const acceptRecommendation = async (req, res, next) => {
  try {
    const { matchId, recipientId } = req.params;
    const match = await matchingService.acceptRecommendation(matchId, recipientId, req.user.sub);
    res.status(200).json(match);
  } catch (error) {
    next(error);
  }
};

export const declineRecommendation = async (req, res, next) => {
  try {
    const { matchId, recipientId } = req.params;
    const match = await matchingService.declineRecommendation(matchId, recipientId, req.user.sub);
    res.status(200).json(match);
  } catch (error) {
    next(error);
  }
};
