"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
function testRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        const redis = new ioredis_1.default({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
        redis.on('connect', () => console.log('✅ Connected to Redis'));
        redis.on('error', (err) => console.error('❌ Redis Error:', err));
        try {
            yield redis.set('test', 'Redis is working!');
            const val = yield redis.get('test');
            console.log('🔹 Redis test value:', val); // should print "Redis is working!"
        }
        catch (err) {
            console.error('❌ Redis operation failed:', err);
        }
        finally {
            redis.disconnect();
        }
    });
}
testRedis();
