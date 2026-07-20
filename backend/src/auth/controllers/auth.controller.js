import { loginSchema } from '../validators/auth.validator.js';
import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData.email, validatedData.password);
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: error.errors
      });
    }
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await authService.refreshUserToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await authService.logoutUser(req.user.id);
    }
    
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Session verified',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};
