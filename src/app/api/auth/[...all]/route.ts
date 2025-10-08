import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { serviceRegistry } from "@/lib/services/ServiceRegistry";

// Wrap auth handlers with service tracking
const handlers = toNextJsHandler(auth);

export const POST = async (req: Request) => {
  const service = serviceRegistry.selectService('auth');
  
  if (service) {
    serviceRegistry.incrementRequestCount(service.id);
    
    try {
      const response = await handlers.POST(req);
      setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
      return response;
    } catch (error) {
      serviceRegistry.incrementErrorCount(service.id);
      setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
      throw error;
    }
  }
  
  return handlers.POST(req);
};

export const GET = async (req: Request) => {
  const service = serviceRegistry.selectService('auth');
  
  if (service) {
    serviceRegistry.incrementRequestCount(service.id);
    
    try {
      const response = await handlers.GET(req);
      setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
      return response;
    } catch (error) {
      serviceRegistry.incrementErrorCount(service.id);
      setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
      throw error;
    }
  }
  
  return handlers.GET(req);
};