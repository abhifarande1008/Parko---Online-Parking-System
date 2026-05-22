"use client";
import React, { useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { AuthRoutes, protectedAuthRoutes, ProtectedRoutes, PublicRoutes, TestRoutes } from "@/lib/routes";
import Header from "./app-header";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SideBarContent } from "@/components/ui/sidebarContent";
import { useMounted } from "@/hooks/use-mounted";
import AuthLayout from "@/components/Auth/Layout";
import { useAuthContext } from "@/context/auth-context";
import PageNotFound from "@/components/ErrorPages/PageNotFound";
import { Provider } from "react-redux";
import { store } from "@/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicURL = PublicRoutes.includes(pathname ?? "");
    const isAuthURL = AuthRoutes.includes(pathname ?? "");
    const isTestURL = TestRoutes.includes(pathname ?? "");
    const isProtectedURL = !isPublicURL && !isAuthURL && ProtectedRoutes.includes(pathname ?? "");
    const isProtectedAuthURL = protectedAuthRoutes.includes(pathname ?? "");
    const { authUser, authLoading } = useAuthContext();
    const isMounted = useMounted();


    const setup = async () => {
        if (!authLoading) {
            if ((isAuthURL || isProtectedAuthURL) && authUser) {
                if (authUser.roles.includes("Admin")) {
                    redirect("/operator-management");
                } else if (authUser.roles.includes("EntryOperator") || authUser.roles.includes("ExitOperator")) {
                    redirect("/verify-reservation");
                } else if (authUser.roles.includes("User")) {
                    if(authUser.emailVerified){
                        redirect("/home");
                    } else if (!authUser.emailVerified) {
                        redirect("/verify-email");
                    }
                } else if (authUser.roles.includes("LandOwner")) {
                    redirect("/home");
                }
            }

            if(!isProtectedAuthURL && authUser && !authUser.emailVerified && authUser.roles.includes("User")){
                redirect("/verify-email");
            }
            if ((isProtectedURL || isProtectedAuthURL) && !authUser) {
                redirect('/login');
            }
        }
    }

    useEffect(() => {
        setup();
    }, [authUser, authLoading, pathname]);

    if (!isMounted || authLoading || authUser === undefined) {
        return <Loading />
    }

    if (pathname === "/" || pathname === null) {
        if (authUser) {
            if(authUser.emailVerified){
                if (authUser.roles.includes("Admin")) {
                    redirect("/operator-management");
                } else if (authUser.roles.includes("EntryOperator") || authUser.roles.includes("ExitOperator")) {
                    redirect("/verify-reservation");
                } else if (authUser.roles.includes("User")) {
                    redirect("/home");
                } else if (authUser.roles.includes("LandOwner")) {
                    redirect("/home");
                }
            }
            else {
                redirect("/verify-email");
            }
        }
        redirect("/login");
    }

    if (isPublicURL) {
        return <React.Fragment>
            {children}
        </React.Fragment>;
    }

    if (isTestURL) {
        return (<SidebarProvider>
            <Sidebar collapsible="icon" className="pt-16 bg-card dark:border-none">
                <SideBarContent />
            </Sidebar>
            <Header />
            {/* <SidebarTrigger /> */}
            {/* </Header> */}
            <main className="w-full">
                {children}
            </main>
        </SidebarProvider>)
    }



    if (isAuthURL && !authUser || isProtectedAuthURL && !authUser?.emailVerified) {
        return <AuthLayout>{children}</AuthLayout>
    }


    if (!isPublicURL && isProtectedURL && authUser ) {
        return (
            <Provider store={store} >
                <SidebarProvider className="p-0 m-0 overflow-hidden">
                    <Sidebar collapsible="icon" className="pt-16 bg-card border-none">
                        <SideBarContent />
                    </Sidebar>
                    <Header>
                        <SidebarTrigger />
                    </Header>
                    <SidebarInset className="w-full h-[100vh] overflow-hidden box-border pt-14 boder-none">
                        <div className="sm:rounded-tl-md h-full overflow-hidden box-border border">{children}</div>
                    </SidebarInset>
                </SidebarProvider>
            </Provider>

        )
    } else if (isProtectedURL && !authUser) {
        redirect("/login");
    }
    
    return <Loading />
}