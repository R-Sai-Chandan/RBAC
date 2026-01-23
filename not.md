Erorrs currently-
there is a missing authentication module eberywhere so we can show anything regarding authentication(as a repository as well as a frontend view)
should change rbac seed as well as the module-template.ts to be having them when it is created

make suername automatic creation based on organization name 

remove base repository depedency
remove hard delete adn add softdelete when applicatebe(is_active)
cehck all the api and amke sure that it is working
upadte forntend
decide about the extra thignw e mgiht require 


audit-log.repository.ts=
findAll(organizationId: string, filters?)
update(organizationId: string, id: string, data)
delete(organizationId: string, id: string)

mode.repository.ts=
update(organizationId: string, id: string, data)
delete(organizationId: string, id: string)

organization.repository.ts=
findAll()

permission.repository.ts=
findAll(organizationId: string, filters?)

record-share.repository.ts=
findAll(organizationId: string, filters?)
update(organizationId: string, id: string, data)

role-profile.repository.ts=
findById(organizationId: string, id: string)
findAll(organizationId: string, filters?)

role.repository.ts=
findAll(organizationId: string, filters?)

smtp-config.repository.ts
findAll(organizationId: string, filters?)



we must add a method iunbto organization.routes.ts since we are having to goign to seed it for the new orgs


not added limit and offset in all the api


if we update the module name in the module-template.ts
we must update orgnaization,smtp,roles and user as well as record sahre and sharing rules. Rest of them are updated