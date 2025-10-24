#!/usr/bin/env node
/**
 * Test script to verify authentication endpoints are working
 * This script tests the key authentication functions
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:9000/api/v1';

const testData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpassword123'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthEndpoint() {
    console.log('\n1. Testing health endpoint...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.text();
        console.log(`✓ Health endpoint: ${response.status} - ${data}`);
        return response.status === 200;
    } catch (error) {
        console.log(`✗ Health endpoint failed: ${error.message}`);
        return false;
    }
}

async function testRegister() {
    console.log('\n2. Testing user registration...');
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const responseData = await response.json();

        if (response.status === 201) {
            console.log('✓ Registration successful');
            return {
                success: true,
                user: responseData.user,
                tokens: responseData.tokens
            };
        } else if (
            response.status === 400 &&
            responseData.message &&
            responseData.message.includes('Email already taken')
        ) {
            console.log('✓ Registration failed as expected (email already exists)');
            return { success: false, reason: 'duplicate_email' };
        } else {
            console.log(`✗ Registration failed: ${response.status} - ${JSON.stringify(responseData)}`);
            return { success: false, reason: 'unknown_error', data: responseData };
        }
    } catch (error) {
        console.log(`✗ Registration error: ${error.message}`);
        return { success: false, reason: 'network_error', error: error.message };
    }
}

async function testLogin() {
    console.log('\n3. Testing user login...');
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testData.email,
                password: testData.password
            })
        });

        const responseData = await response.json();

        if (response.status === 200) {
            console.log('✓ Login successful');
            return {
                success: true,
                user: responseData.user,
                tokens: responseData.tokens
            };
        } else {
            console.log(`✗ Login failed: ${response.status} - ${JSON.stringify(responseData)}`);
            return { success: false, data: responseData };
        }
    } catch (error) {
        console.log(`✗ Login error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testLogout(refreshToken) {
    console.log('\n4. Testing user logout...');
    try {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshToken
            })
        });

        if (response.status === 204) {
            console.log('✓ Logout successful');
            return { success: true };
        } else {
            const responseData = await response.json();
            console.log(`✗ Logout failed: ${response.status} - ${JSON.stringify(responseData)}`);
            return { success: false, data: responseData };
        }
    } catch (error) {
        console.log(`✗ Logout error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting authentication endpoint tests...');

    // Test health endpoint first
    const healthOk = await testHealthEndpoint();
    if (!healthOk) {
        console.log('\n❌ Server not responding. Make sure the server is running on port 9000');
        return;
    }

    await sleep(500);

    // Test registration
    const registerResult = await testRegister();

    await sleep(500);

    // Test login regardless of registration result
    const loginResult = await testLogin();

    if (loginResult.success) {
        await sleep(500);

        // Test logout if login was successful
        await testLogout(loginResult.tokens.refresh.token);
    }

    console.log('\n📊 Test Summary:');
    console.log(`Health endpoint: ✓`);
    console.log(`Registration: ${registerResult.success ? '✓' : '✗'}`);
    console.log(`Login: ${loginResult.success ? '✓' : '✗'}`);

    if (loginResult.success) {
        console.log('\n🎉 Basic authentication flow is working!');
    } else {
        console.log('\n🚨 Login endpoint has issues. Check server logs for details.');
    }
}

// Run the tests
runTests().catch(console.error);
