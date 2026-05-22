import { LogOut } from "lucide-react";
import Link from "next/link";
import paths, { IPath } from "@/lib/mainRoutes";
import { redirect, usePathname } from "next/navigation";
import { SidebarContent, SidebarFooter, SidebarGroup, useSidebar } from "./sidebar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import useLogOut from "@/hooks/use-logout";
import { Tooltip, TooltipContent, TooltipProvider } from "./tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAuthContext } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useScreenType } from "@/hooks/useScreenType";
import InlineLoader from "./inline-loader";

export function SideBarContent() {
  const { setOpen, state, setOpenMobile } = useSidebar();
  const { triggerLogOut, logoutLoading } = useLogOut();
  const screenType = useScreenType();
  const { authUser } = useAuthContext();
  const pathname = usePathname();
  const [filteredPaths, setFilteredPaths] = useState<IPath[]>([]);

  useEffect(()=>{
    const selectedPaths = paths.filter(path => path.roles.some(role => authUser?.roles.includes(role)))
    setFilteredPaths(selectedPaths);
  },[authUser?.roles]);

  useEffect(()=>{
    if(screenType=="phone"){
      setOpen(true);
    }else{
      setOpen(false);
    }
  },[screenType])

  return (
    <>
      <SidebarContent  className="gap-2 bg-card" {...(screenType!="phone" && {onClick:() => { setOpen(true); }, onMouseLeave:() => { setOpen(false) }})}>
        {filteredPaths.map(path => {
          return path.subPaths ?
            <SidebarGroup key={path.pathId} className="w-full">
              <Accordion type="single" collapsible>
                <AccordionItem onClick={() => { setOpenMobile(false); redirect(path.path); }} value="item-1">
                  <AccordionTrigger className="flex items-center cursor-pointer gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <path.icon className="h-5 w-5" />
                    {state == "expanded" && <span>{path.name}</span>}
                  </AccordionTrigger>

                  <AccordionContent className="pl-6">
                    {path.subPaths.length && path.subPaths.map((subPath) =>
                      <Tooltip key={subPath.pathId}>
                        <TooltipTrigger>
                          <SidebarGroup
                            key={subPath.subPathId}
                            onClick={(e) => { e.preventDefault(); setOpenMobile(false); redirect(subPath.path); }}
                            className=" animate-accordian-down transition-all flex flex-row p-2 gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <subPath.icon className="h-5 w-5" />
                            {state == "expanded" && <span>{subPath.name}</span>}
                          </SidebarGroup>
                        </TooltipTrigger>
                        <TooltipContent>{subPath.name}</TooltipContent>
                      </Tooltip>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarGroup>
            :
            <TooltipProvider key={path.pathId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarGroup key={path.pathId} className="py-2 px-0 pl-2">
                  <Accordion type="single" className="p-0 w-full" collapsible>
                    <AccordionItem value={path.path} className={`p-0 w-full flex items-center`}>
                      <AccordionTrigger 
                      className={`flex cursor-pointer w-full gap-2 ${screenType !="phone" && "items-center"} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent rounded-r-none ${pathname?.includes(path.path) && screenType!="phone" && "rounded-r-none border-r-primary"}`}
                      onClick={() => { setOpenMobile(false); redirect(path.path); }} key={path.pathId}>
                        <path.icon className="h-5 w-5" />
                        {state == "expanded" && <span>{path.name}</span>}
                      </AccordionTrigger>
                    </AccordionItem>
                  </Accordion>
                </SidebarGroup>
              </TooltipTrigger>
              <TooltipContent>{path.name}</TooltipContent>
            </Tooltip>
            </TooltipProvider>
        })}
      </SidebarContent>
      <SidebarFooter className="bg-card">
        <Link
          href="#"
          onClick={triggerLogOut}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {logoutLoading ? <InlineLoader/> : <LogOut className="w-5 h-5" />}
          {state == "expanded" && <span>Logout</span>}
        </Link>
      </SidebarFooter>
    </>
  );
}