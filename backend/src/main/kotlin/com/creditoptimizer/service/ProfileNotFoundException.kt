package com.creditoptimizer.service

class ProfileNotFoundException(id: Int) : Exception("Profile $id not found")
